import urllib.request
import urllib.error
import json

url_template = "https://api.husnoorinfotech.in/api/admin/appointments/{id}/status/"

def test_status(appt_id, status_val):
    url = url_template.format(id=appt_id)
    data = json.dumps({"status": status_val}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="PATCH",
        headers={
            "User-Agent": "Mozilla/5.0",
            "Content-Type": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Appt {appt_id} -> Status '{status_val}' -> Success: {response.read().decode()}")
            return True
    except urllib.error.HTTPError as e:
        print(f"Appt {appt_id} -> Status '{status_val}' -> HTTP {e.code}: {e.read().decode()}")
        return False
    except Exception as e:
        print(f"Appt {appt_id} -> Status '{status_val}' -> Error: {e}")
        return False

# Test choices on pending appointment (ID 2)
choices = ["approved", "confirmed", "completed", "accepted", "active", "cancelled", "Pending", "Approved", "Confirmed"]
for choice in choices:
    test_status(2, choice)
