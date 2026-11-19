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
        self.assertEqual(len(archive["counties"]), 10)
        self.assertEqual(sum(map(len, archive["counties"].values())), 25)
        self.assertEqual(archive["counties"]["Queens County"], [["County total", 18, 468, 173, 295]])
        for rows in archive["counties"].values():
            if len(rows) == 1:
                continue
            for col in (2, 3, 4):
                numbers = [row[col] for row in rows[:-1] if row[col] is not None]
                self.assertEqual(sum(numbers) if numbers else None, rows[-1][col])
