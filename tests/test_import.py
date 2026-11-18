from pathlib import Path
import json
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
from refresh import amount,csv_url,ROOT

class ImportChecks(unittest.TestCase):
    def test_suppressed_and_missing_not_zero(self):
        self.assertEqual(amount("0"),0)
        self.assertIsNone(amount("x"))
        self.assertIsNone(amount(""))
        with self.assertRaises(ValueError): amount("bad")

    def test_snapshot_structure(self):
        data=json.loads((ROOT/"web/data/records.json").read_text())
        keys=[(r["region"],r["year"]) for r in data["rows"]]
        self.assertEqual(len(keys),len(set(keys)))
        self.assertGreaterEqual(len([k for k in keys if k[0]=="Nova Scotia"]),35)
        self.assertIn(("Nova Scotia",2024),keys)

    def test_historical_transcription_totals(self):
        archive=json.loads((ROOT/"web/data/districts-1931.json").read_text())
        for rows in archive["counties"].values():
            self.assertEqual([sum((r[i] or 0) for r in rows[:-1]) for i in [2,3,4]],rows[-1][2:])
