import os
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()


class GraniteAgent:
    """
    Agent: IBM Granite (watsonx.ai) integration for investigation summary generation.
    Falls back to rule-based summary if IBM credentials are not configured.
    """

    def __init__(self):
        self.api_key = os.getenv("IBM_API_KEY", "")
        self.project_id = os.getenv("IBM_PROJECT_ID", "")
        self.region = os.getenv("IBM_REGION", "us-south")
        self.model_id = os.getenv("GRANITE_MODEL_ID", "ibm/granite-13b-instruct-v2")
        self._client = None

    def _get_client(self):
        """Lazy-initialize the watsonx.ai client."""
        if self._client is not None:
            return self._client
        try:
            from ibm_watsonx_ai import APIClient, Credentials
            credentials = Credentials(
                url=f"https://{self.region}.ml.cloud.ibm.com",
                api_key=self.api_key,
            )
            self._client = APIClient(credentials)
            return self._client
        except Exception:
            return None

    def _is_configured(self) -> bool:
        return bool(self.api_key and self.project_id and self.api_key != "your_ibm_api_key_here")

    def generate_summary(
        self,
        record: Dict[str, Any],
        risk_score: float,
        risk_level: str,
        evidence: List[Dict[str, Any]],
        recommended_action: str,
    ) -> str:
        """
        Generate an investigation summary. Uses IBM Granite if credentials are
        available, otherwise falls back to rule-based text generation.
        """
        if self._is_configured():
            try:
                return self._granite_summary(record, risk_score, risk_level, evidence, recommended_action)
            except Exception as e:
                # Fall back gracefully on any API error
                fallback = self._rule_based_summary(record, risk_score, risk_level, evidence, recommended_action)
                return fallback + f"\n\n[Note: IBM Granite API unavailable ({str(e)[:80]}). Rule-based summary generated.]"

        return self._rule_based_summary(record, risk_score, risk_level, evidence, recommended_action)

    def _build_prompt(
        self,
        record: Dict[str, Any],
        risk_score: float,
        risk_level: str,
        evidence: List[Dict[str, Any]],
        recommended_action: str,
    ) -> str:
        evidence_text = "\n".join(
            f"- {e['signal']}: {e['value']} → {e['interpretation']}"
            for e in evidence
            if e.get("weight", 0) > 0 or e.get("signal") == "Payment History"
        )

        prompt = f"""You are an electricity fraud investigation assistant. Based on the following evidence, write a concise, professional investigation summary for a utility investigator.

Consumer: {record.get('name')} (ID: {record.get('consumer_id')})
Area: {record.get('area')} | Connection: {record.get('connection_type')} | Meter: {record.get('meter_number')}
Computed Risk Score: {risk_score}/100 ({risk_level} Risk)

Evidence Summary:
{evidence_text}

Instructions:
- Use cautious, professional language. Say "suspicious anomaly" or "requires verification" — never directly accuse the consumer.
- Describe what the data shows and why it warrants investigation.
- Mention the most significant 2-3 evidence signals.
- End with the recommended action.
- Keep the summary to 3-4 sentences.

Investigation Summary:"""
        return prompt

    def _granite_summary(
        self,
        record: Dict[str, Any],
        risk_score: float,
        risk_level: str,
        evidence: List[Dict[str, Any]],
        recommended_action: str,
    ) -> str:
        from ibm_watsonx_ai.foundation_models import ModelInference
        from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams

        client = self._get_client()
        if client is None:
            raise RuntimeError("Could not initialize watsonx.ai client")

        model = ModelInference(
            model_id=self.model_id,
            api_client=client,
            project_id=self.project_id,
            params={
                GenParams.MAX_NEW_TOKENS: 300,
                GenParams.TEMPERATURE: 0.2,
                GenParams.STOP_SEQUENCES: ["\n\n", "---"],
            },
        )

        prompt = self._build_prompt(record, risk_score, risk_level, evidence, recommended_action)
        response = model.generate_text(prompt=prompt)
        return response.strip() if isinstance(response, str) else str(response)

    def _rule_based_summary(
        self,
        record: Dict[str, Any],
        risk_score: float,
        risk_level: str,
        evidence: List[Dict[str, Any]],
        recommended_action: str,
    ) -> str:
        """
        Generates a rule-based investigation summary when IBM Granite is unavailable.
        """
        name = record.get("name", "this consumer")
        cid = record.get("consumer_id", "")
        area = record.get("area", "")
        current = float(record.get("current_reading", 0))

        # Find most significant evidence signals
        top_evidence = [e for e in evidence if e.get("weight", 0) >= 0.20]
        top_evidence.sort(key=lambda x: x.get("weight", 0), reverse=True)

        # Build summary based on risk level
        if risk_level == "Critical":
            opening = (
                f"Investigation of consumer {cid} ({name}) in {area} reveals a critical risk score of "
                f"{risk_score:.0f}/100, indicating multiple suspicious anomalies that require immediate verification."
            )
        elif risk_level == "High":
            opening = (
                f"Consumer {cid} ({name}) in {area} has been assigned a high risk score of {risk_score:.0f}/100 "
                f"based on statistically significant deviations in consumption patterns."
            )
        elif risk_level == "Medium":
            opening = (
                f"Consumer {cid} ({name}) in {area} shows a moderate risk score of {risk_score:.0f}/100 with "
                f"several consumption anomalies that warrant administrative review."
            )
        else:
            opening = (
                f"Consumer {cid} ({name}) in {area} presents a low risk score of {risk_score:.0f}/100. "
                f"Consumption patterns are broadly within expected ranges."
            )

        # Key findings
        findings = ""
        if top_evidence:
            finding = top_evidence[0]
            findings = f" Key finding: {finding['signal']} — {finding['interpretation']}"
            if len(top_evidence) > 1:
                f2 = top_evidence[1]
                findings += f" Additionally, {f2['signal'].lower()} shows: {f2['interpretation']}"

        # Action
        action_short = recommended_action.split(".")[0] + "."

        summary = opening + findings + f" Recommended action: {action_short}"
        summary += "\n\n[Note: This summary was generated by the rule-based fallback engine. Connect IBM watsonx.ai credentials for AI-generated summaries.]"

        return summary
