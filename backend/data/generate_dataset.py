"""
generate_dataset.py
Generates synthetic WattWatch AI consumer dataset (250+ records).
Run: python backend/data/generate_dataset.py
Outputs: backend/data/consumers.json
"""
import json
import random
import math
import os

random.seed(42)

AREAS = ["Rajouri", "Udhampur", "Reasi", "Ramban", "Bhaderwah", "Doda", "Kishtwar", "Batote"]
CONNECTION_TYPES = ["Residential", "Commercial", "Industrial"]
PAYMENT_STATUSES = ["Paid", "Unpaid", "Partial", "Defaulter"]
FIRST_NAMES = [
    "Arjun", "Priya", "Ravi", "Sunita", "Mohan", "Kavita", "Rajesh", "Anjali",
    "Suresh", "Meena", "Anil", "Pooja", "Vikram", "Suman", "Deepak", "Rekha",
    "Amit", "Neha", "Sanjay", "Geeta", "Ramesh", "Usha", "Dinesh", "Shanti",
    "Mahesh", "Lata", "Vikas", "Asha", "Subash", "Kamla", "Harish", "Savita",
    "Prakash", "Sudha", "Mukesh", "Anita", "Naresh", "Nirmala", "Girish", "Pushpa",
    "Lokesh", "Sarla", "Bharat", "Vimla", "Chetan", "Manju", "Omkar", "Radha",
    "Yashpal", "Parveen", "Rohit", "Seema", "Ajay", "Kiran", "Vijay", "Shobha",
    "Ashok", "Vandana", "Gopal", "Madhuri"
]
LAST_NAMES = [
    "Sharma", "Kumar", "Singh", "Devi", "Gupta", "Yadav", "Verma", "Pandey",
    "Tiwari", "Mishra", "Saxena", "Bhat", "Raina", "Dogra", "Choudhary", "Pathak",
    "Joshi", "Negi", "Thakur", "Mehta", "Kaur", "Chatterjee", "Reddy", "Pillai",
    "Desai", "Nair", "Iyer", "Sinha", "Rastogi", "Dubey"
]

AREA_BASELINES = {
    "Rajouri": {"Residential": 320, "Commercial": 800, "Industrial": 2200},
    "Udhampur": {"Residential": 290, "Commercial": 750, "Industrial": 2000},
    "Reasi": {"Residential": 270, "Commercial": 700, "Industrial": 1900},
    "Ramban": {"Residential": 260, "Commercial": 680, "Industrial": 1800},
    "Bhaderwah": {"Residential": 280, "Commercial": 720, "Industrial": 1950},
    "Doda": {"Residential": 300, "Commercial": 760, "Industrial": 2100},
    "Kishtwar": {"Residential": 265, "Commercial": 690, "Industrial": 1850},
    "Batote": {"Residential": 275, "Commercial": 710, "Industrial": 1920},
}

AREA_LOAD = {
    "Residential": (1.0, 5.0),
    "Commercial": (5.0, 20.0),
    "Industrial": (20.0, 100.0),
}


def random_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def gen_meter_number(area_code, idx):
    return f"MTR{area_code[:2].upper()}{str(idx).zfill(5)}"


def gen_history(baseline, std_pct=0.12, months=12):
    std = baseline * std_pct
    return [max(0, round(random.gauss(baseline, std), 1)) for _ in range(months)]


def gen_consumer(cid, area, conn_type, profile="normal", idx=0):
    baseline = AREA_BASELINES[area][conn_type]
    std = baseline * 0.12
    hist = gen_history(baseline)

    if profile == "normal":
        current = round(random.gauss(baseline, std))
        anomaly_flags = []
        payment = random.choices(PAYMENT_STATUSES, weights=[70, 15, 10, 5])[0]

    elif profile == "medium_anomaly":
        deviation = random.uniform(-0.4, -0.25)
        current = round(baseline * (1 + deviation))
        anomaly_flags = random.choices([
            ["billing_discrepancy"], ["peer_deviation"], ["low_usage_pattern"],
            ["billing_discrepancy", "low_usage_pattern"], []
        ], weights=[20, 20, 20, 20, 20])[0]
        payment = random.choices(PAYMENT_STATUSES, weights=[50, 25, 15, 10])[0]

    elif profile == "high_anomaly":
        deviation = random.uniform(-0.65, -0.45)
        current = round(baseline * (1 + deviation))
        anomaly_flags = random.choices([
            ["sudden_consumption_drop"], ["meter_tampering_suspected"],
            ["billing_mismatch", "sudden_consumption_drop"],
            ["meter_bypass_suspected"], ["underreporting_pattern"]
        ], weights=[25, 20, 25, 15, 15])[0]
        payment = random.choices(PAYMENT_STATUSES, weights=[30, 30, 20, 20])[0]

    elif profile == "critical_anomaly":
        deviation = random.uniform(-0.85, -0.70)
        current = round(baseline * (1 + deviation))
        anomaly_flags = ["meter_tampering_suspected", "sudden_consumption_drop", "billing_mismatch"]
        payment = random.choices(PAYMENT_STATUSES, weights=[20, 30, 20, 30])[0]

    else:
        current = round(random.gauss(baseline, std))
        anomaly_flags = []
        payment = "Paid"

    # Clamp current to non-negative
    current = max(current, 5)

    # Previous reading: simulate ongoing meter
    start_reading = random.randint(1000, 50000)
    previous_reading = start_reading
    current_reading = start_reading + current

    # Billing units - may have slight discrepancy for anomaly profiles
    if profile in ("high_anomaly", "critical_anomaly"):
        billed_units = round(current * random.uniform(0.5, 0.8))  # under-billing
    else:
        billed_units = round(current * random.uniform(0.97, 1.03))

    # Monthly bill based on tiered tariff (simplified)
    rate = 3.5 if conn_type == "Residential" else (6.0 if conn_type == "Commercial" else 9.0)
    monthly_bill = round(billed_units * rate + random.uniform(-20, 20), 2)
    monthly_bill = max(0, monthly_bill)

    load_range = AREA_LOAD[conn_type]
    sanctioned_load = round(random.uniform(*load_range), 1)

    return {
        "consumer_id": cid,
        "name": random_name(),
        "area": area,
        "connection_type": conn_type,
        "sanctioned_load": sanctioned_load,
        "meter_number": gen_meter_number(area, idx),
        "previous_reading": previous_reading,
        "current_reading": current_reading,
        "billed_units": billed_units,
        "monthly_bill": monthly_bill,
        "payment_status": payment,
        "historical_monthly_usage": hist,
        "peer_group": f"{area}_{conn_type}",
        "anomaly_flags": anomaly_flags,
    }


def generate_dataset():
    consumers = []
    idx = 1

    # ---- Special cases ----

    # RJ10293: Normal history 350-410 units, current 75 — high anomaly
    normal_hist_rj10293 = [round(random.gauss(382, 18), 1) for _ in range(12)]
    consumers.append({
        "consumer_id": "RJ10293",
        "name": "Rajesh Kumar Sharma",
        "area": "Rajouri",
        "connection_type": "Residential",
        "sanctioned_load": 3.5,
        "meter_number": "MTRRJ10293",
        "previous_reading": 18450,
        "current_reading": 18525,
        "billed_units": 75,
        "monthly_bill": 262.5,
        "payment_status": "Paid",
        "historical_monthly_usage": normal_hist_rj10293,
        "peer_group": "Rajouri_Residential",
        "anomaly_flags": ["sudden_consumption_drop", "meter_tampering_suspected"],
    })

    # RJ10541: Meter reading mismatch — critical billing inconsistency
    hist_rj10541 = [round(random.gauss(310, 25), 1) for _ in range(12)]
    consumers.append({
        "consumer_id": "RJ10541",
        "name": "Sunita Devi Choudhary",
        "area": "Rajouri",
        "connection_type": "Residential",
        "sanctioned_load": 2.5,
        "meter_number": "MTRRJ10541",
        "previous_reading": 22100,
        "current_reading": 22680,
        "billed_units": 180,   # metered = 580, billed = 180 — critical mismatch
        "monthly_bill": 630.0,
        "payment_status": "Partial",
        "historical_monthly_usage": hist_rj10541,
        "peer_group": "Rajouri_Residential",
        "anomaly_flags": ["billing_mismatch", "meter_reading_discrepancy"],
    })

    # RJ10872: Normal, low risk control case
    hist_rj10872 = [round(random.gauss(295, 20), 1) for _ in range(12)]
    avg_rj10872 = sum(hist_rj10872) / 12
    consumers.append({
        "consumer_id": "RJ10872",
        "name": "Mohan Lal Verma",
        "area": "Rajouri",
        "connection_type": "Residential",
        "sanctioned_load": 2.0,
        "meter_number": "MTRRJ10872",
        "previous_reading": 31200,
        "current_reading": round(31200 + avg_rj10872),
        "billed_units": round(avg_rj10872),
        "monthly_bill": round(avg_rj10872 * 3.5, 2),
        "payment_status": "Paid",
        "historical_monthly_usage": hist_rj10872,
        "peer_group": "Rajouri_Residential",
        "anomaly_flags": [],
    })

    # ---- Distribute remaining 247+ consumers ----
    # Profile distribution: ~60% normal, ~20% medium, ~10% high, ~10% critical
    total_target = 253  # 250 + 3 special = 253 minimum
    remaining = total_target - 3

    area_pool = AREAS * 40  # enough to pick from
    conn_pool = (["Residential"] * 7 + ["Commercial"] * 2 + ["Industrial"] * 1) * 40

    profiles = (
        ["normal"] * 60
        + ["medium_anomaly"] * 20
        + ["high_anomaly"] * 12
        + ["critical_anomaly"] * 8
    )

    for i in range(remaining):
        area = area_pool[i % len(AREAS)] if i < len(AREAS) else random.choice(AREAS)
        conn = conn_pool[i]
        profile = profiles[i % len(profiles)]

        cid = f"WW{str(10001 + i).zfill(5)}"
        c = gen_consumer(cid, area, conn, profile, idx)
        consumers.append(c)
        idx += 1

    return consumers


if __name__ == "__main__":
    data = generate_dataset()
    out_path = os.path.join(os.path.dirname(__file__), "consumers.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Generated {len(data)} consumers -> {out_path}")
