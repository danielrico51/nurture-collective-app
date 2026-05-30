import os
import unittest
from unittest.mock import patch

from services.intake_service import (
    enrich_payload,
    normalize_payload,
    normalize_phone,
    validate_payload,
)


class IntakeServiceTests(unittest.TestCase):
    def test_validate_requires_contact_method(self):
        with self.assertRaises(Exception):
            validate_payload(
                {
                    "first_name": "Jane",
                    "service_requested": "Doula",
                }
            )

    def test_normalize_phone(self):
        self.assertEqual(normalize_phone("2015550100"), "+12015550100")

    def test_enrich_payload(self):
        payload = normalize_payload(
            validate_payload(
                {
                    "first_name": "Jane",
                    "email": "jane@example.com",
                    "service_requested": "Doula",
                }
            )
        )
        lead = enrich_payload(payload)
        self.assertEqual(lead.status, "new")
        self.assertEqual(lead.version, 1)
        self.assertTrue(lead.lead_id)

    @patch("services.intake_service.put_json")
    @patch("services.intake_service.send_to_n8n", return_value=False)
    @patch("services.intake_service.LeadRepository")
    def test_submit_intake_stores_and_returns(self, repo_cls, _send, put_json):
        repo_cls.return_value.bucket = "test-bucket"
        os.environ["LEADS_BUCKET"] = "test-bucket"
        os.environ["N8N_WEBHOOK_URL"] = ""

        from services.intake_service import submit_intake

        result = submit_intake(
            {
                "first_name": "Jane",
                "email": "jane@example.com",
                "service_requested": "Doula",
            },
            client_key="test-client",
        )
        self.assertTrue(result.success)
        self.assertTrue(result.stored)
        put_json.assert_called()


if __name__ == "__main__":
    unittest.main()
