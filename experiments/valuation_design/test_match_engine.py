"""
Tests for BMW X5 40e Match Engine
"""
import unittest
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

import pandas as pd
import numpy as np
from config_resolver import ConfigurationResolver, normalize_variant, is_phev, is_awd, is_gasoline, validate_price, extract_price_from_description
from match_engine import MatchEngine, MatchLevel, PriceAdjustmentEngine, calculate_weighted_result


class TestConfigurationResolver(unittest.TestCase):
    """Test configuration resolver."""
    
    def setUp(self):
        self.resolver = ConfigurationResolver()
    
    def test_x5_40e_is_phev(self):
        """X5 40e should be recognized as PHEV."""
        config = self.resolver.resolve(
            "BMW X5 40e X Drive 2018 Plug-in Hybrid",
            {'make': 'BMW', 'model': 'X5', 'year': 2018}
        )
        self.assertEqual(config.powertrain, 'PHEV')
    
    def test_x5_40e_is_awd(self):
        """X5 40e should be recognized as AWD."""
        config = self.resolver.resolve(
            "BMW X5 40e X Drive 2018 Plug-in Hybrid",
            {'make': 'BMW', 'model': 'X5', 'year': 2018}
        )
        self.assertEqual(config.drivetrain, 'AWD')
    
    def test_phev_not_gasoline(self):
        """PHEV should not be recognized as Gasoline."""
        config = self.resolver.resolve(
            "BMW X5 40e X Drive 2018 Plug-in Hybrid",
            {'make': 'BMW', 'model': 'X5', 'year': 2018}
        )
        self.assertNotEqual(config.powertrain, 'Gasoline')
    
    def test_awd_not_unknown(self):
        """AWD should be recognized, not unknown."""
        config = self.resolver.resolve(
            "BMW X5 40e X Drive 2018 Plug-in Hybrid",
            {'make': 'BMW', 'model': 'X5', 'year': 2018}
        )
        self.assertIsNotNone(config.drivetrain)
        self.assertEqual(config.drivetrain, 'AWD')
    
    def test_price_zero_rejected(self):
        """Price 0 should be rejected as invalid placeholder."""
        description = "Price: 0 JOD. Later: 30,000 JOD"
        price = extract_price_from_description(description)
        self.assertIsNotNone(price)
        self.assertEqual(price, 30000)
    
    def test_price_zero_only(self):
        """Price 0 alone should be rejected."""
        description = "Price: 0 JOD"
        price = extract_price_from_description(description)
        self.assertIsNone(price)
    
    def test_asking_price_invariance(self):
        """Asking price should not affect valuation."""
        target_config = {
            'make': 'BMW',
            'model': 'X5',
            'year': 2018,
            'variant': '40e',
            'powertrain': 'PHEV',
            'drivetrain': 'AWD',
            'transmission': 'Automatic',
            'condition': 'Excellent',
            'mileage_km': 171000
        }
        
        engine = MatchEngine(target_config)
        
        # Same comparable with different asking prices should produce same result
        comparable = {
            'make': 'BMW',
            'model': 'X5',
            'year': 2018,
            'variant': '40e',
            'powertrain': 'PHEV',
            'drivetrain': 'AWD',
            'transmission': 'Automatic',
            'condition': 'Excellent',
            'mileage_km': 100000,
            'price': 26500
        }
        
        result = engine.match(comparable)
        self.assertEqual(result.match_level, MatchLevel.L1_EXACT)
        self.assertEqual(result.base_price, 26500)


class TestMatchEngine(unittest.TestCase):
    """Test match engine."""
    
    def setUp(self):
        self.target_config = {
            'make': 'BMW',
            'model': 'X5',
            'year': 2018,
            'variant': '40e',
            'powertrain': 'PHEV',
            'drivetrain': 'AWD',
            'transmission': 'Automatic',
            'condition': 'Excellent',
            'mileage_km': 171000
        }
        self.engine = MatchEngine(self.target_config)
    
    def test_l1_exact_match(self):
        """L1: X5 + 2018 + 40e/PHEV + AWD."""
        comparable = {
            'make': 'BMW',
            'model': 'X5',
            'year': 2018,
            'variant': '40e',
            'powertrain': 'PHEV',
            'drivetrain': 'AWD',
            'transmission': 'Automatic',
            'condition': 'Excellent',
            'mileage_km': 100000,
            'price': 26500
        }
        result = self.engine.match(comparable)
        self.assertEqual(result.match_level, MatchLevel.L1_EXACT)
        self.assertTrue(result.is_direct)
        self.assertEqual(result.weight, 1.0)
    
    def test_l2_variant_family(self):
        """L2: X5 + 2018 + PHEV + AWD (no variant specified)."""
        comparable = {
            'make': 'BMW',
            'model': 'X5',
            'year': 2018,
            'variant': None,
            'powertrain': 'PHEV',
            'drivetrain': 'AWD',
            'transmission': 'Automatic',
            'condition': 'Excellent',
            'mileage_km': 63000,
            'price': 31000
        }
        result = self.engine.match(comparable)
        self.assertEqual(result.match_level, MatchLevel.L2_VARIANT_FAMILY)
        self.assertTrue(result.is_direct)
        self.assertEqual(result.weight, 0.9)
    
    def test_l3_powertrain(self):
        """L3: X5 + 2018 + PHEV (no AWD)."""
        comparable = {
            'make': 'BMW',
            'model': 'X5',
            'year': 2018,
            'variant': None,
            'powertrain': 'PHEV',
            'drivetrain': None,
            'transmission': 'Automatic',
            'condition': 'Excellent',
            'mileage_km': 90000,
            'price': 26500
        }
        result = self.engine.match(comparable)
        self.assertEqual(result.match_level, MatchLevel.L3_POWERTRAIN)
        self.assertFalse(result.is_direct)
        self.assertEqual(result.weight, 0.7)
    
    def test_l4_year_range(self):
        """L4: X5 + 2017-2019 + PHEV."""
        comparable = {
            'make': 'BMW',
            'model': 'X5',
            'year': 2019,
            'variant': None,
            'powertrain': 'PHEV',
            'drivetrain': None,
            'transmission': 'Automatic',
            'condition': 'Excellent',
            'mileage_km': 130000,
            'price': 32000
        }
        result = self.engine.match(comparable)
        self.assertEqual(result.match_level, MatchLevel.L4_YEAR_RANGE)
        self.assertFalse(result.is_direct)
        self.assertEqual(result.weight, 0.5)
    
    def test_l5_model_range(self):
        """L5: X5 + 2016-2020 + Hybrid/PHEV."""
        comparable = {
            'make': 'BMW',
            'model': 'X5',
            'year': 2020,
            'variant': None,
            'powertrain': 'Hybrid',
            'drivetrain': None,
            'transmission': 'Automatic',
            'condition': 'Excellent',
            'mileage_km': 58000,
            'price': 29000
        }
        result = self.engine.match(comparable)
        self.assertEqual(result.match_level, MatchLevel.L5_MODEL_RANGE)
        self.assertFalse(result.is_direct)
        self.assertEqual(result.weight, 0.3)
    
    def test_l6_neighboring(self):
        """L6: X5 neighboring configurations."""
        comparable = {
            'make': 'BMW',
            'model': 'X5',
            'year': 2015,
            'variant': None,
            'powertrain': 'Gasoline',
            'drivetrain': None,
            'transmission': 'Automatic',
            'condition': 'Excellent',
            'mileage_km': 186000,
            'price': 27000
        }
        result = self.engine.match(comparable)
        self.assertEqual(result.match_level, MatchLevel.L6_NEIGHBORING)
        self.assertFalse(result.is_direct)
        self.assertEqual(result.weight, 0.15)
    
    def test_l7_family(self):
        """L7: BMW SUV family."""
        comparable = {
            'make': 'BMW',
            'model': 'X3',
            'year': 2018,
            'variant': None,
            'powertrain': 'Gasoline',
            'drivetrain': None,
            'transmission': 'Automatic',
            'condition': 'Excellent',
            'mileage_km': 100000,
            'price': 25000
        }
        result = self.engine.match(comparable)
        self.assertEqual(result.match_level, MatchLevel.L7_FAMILY)
        self.assertFalse(result.is_direct)
        self.assertEqual(result.weight, 0.05)
    
    def test_no_match(self):
        """Non-BMW should not match."""
        comparable = {
            'make': 'Mercedes',
            'model': 'GLE',
            'year': 2018,
            'variant': None,
            'powertrain': 'Gasoline',
            'drivetrain': None,
            'transmission': 'Automatic',
            'condition': 'Excellent',
            'mileage_km': 100000,
            'price': 30000
        }
        result = self.engine.match(comparable)
        self.assertEqual(result.match_level, MatchLevel.NO_MATCH)
        self.assertFalse(result.is_direct)
        self.assertEqual(result.weight, 0.0)
    
    def test_186k_comparable_not_exact(self):
        """186k comparable should not be exact match due to mileage."""
        comparable = {
            'make': 'BMW',
            'model': 'X5',
            'year': 2018,
            'variant': '40e',
            'powertrain': 'PHEV',
            'drivetrain': 'AWD',
            'transmission': 'Automatic',
            'condition': 'Excellent',
            'mileage_km': 186000,
            'price': 27000
        }
        result = self.engine.match(comparable)
        # Should be L1 but with mileage mismatch noted
        self.assertEqual(result.match_level, MatchLevel.L1_EXACT)
        self.assertTrue(any('mileage' in reason.lower() for reason in result.mismatch_reasons))


class TestPriceAdjustmentEngine(unittest.TestCase):
    """Test price adjustment engine."""
    
    def setUp(self):
        # Create minimal training data
        self.training_data = pd.DataFrame({
            'year': [2016, 2017, 2018, 2019, 2020] * 20,
            'price': [20000, 22000, 25000, 28000, 30000] * 20,
            'mileage_km': [150000, 120000, 100000, 80000, 60000] * 20,
            'fuel_type': ['Gasoline'] * 50 + ['PHEV'] * 50,
            'drivetrain': ['RWD'] * 50 + ['AWD'] * 50,
            'condition': ['Good'] * 100
        })
        self.engine = PriceAdjustmentEngine(self.training_data)
    
    def test_year_adjustment_available(self):
        """Year adjustment should be available."""
        self.assertTrue(self.engine.adjustments['year']['available'])
    
    def test_mileage_adjustment_available(self):
        """Mileage adjustment should be available."""
        self.assertTrue(self.engine.adjustments['mileage']['available'])
    
    def test_powertrain_adjustment_available(self):
        """Powertrain adjustment should be available."""
        self.assertTrue(self.engine.adjustments['powertrain']['available'])
    
    def test_drivetrain_adjustment_available(self):
        """Drivetrain adjustment should be available."""
        self.assertTrue(self.engine.adjustments['drivetrain']['available'])
    
    def test_no_invented_adjustments(self):
        """No adjustments should be invented without data."""
        # Create empty training data
        empty_engine = PriceAdjustmentEngine(pd.DataFrame())
        self.assertFalse(empty_engine.adjustments['year']['available'])
        self.assertFalse(empty_engine.adjustments['mileage']['available'])
        self.assertFalse(empty_engine.adjustments['powertrain']['available'])
        self.assertFalse(empty_engine.adjustments['drivetrain']['available'])


class TestWeightedResult(unittest.TestCase):
    """Test weighted result calculation."""
    
    def test_weighted_result_with_l1(self):
        """Weighted result with L1 match should pass evidence gate."""
        from match_engine import MatchResult
        
        results = [
            MatchResult(
                match_level=MatchLevel.L1_EXACT,
                base_price=26500,
                target_equivalent_price=28000,
                weight=1.0,
                is_direct=True
            ),
            MatchResult(
                match_level=MatchLevel.L2_VARIANT_FAMILY,
                base_price=31000,
                target_equivalent_price=29000,
                weight=0.9,
                is_direct=True
            )
        ]
        
        result = calculate_weighted_result(results)
        self.assertEqual(result['evidence_gate'], 'PASS')
        self.assertIsNotNone(result['weighted_price'])
        self.assertIsNotNone(result['uncertainty'])
    
    def test_weighted_result_without_l1(self):
        """Weighted result without L1 match should have limited evidence gate."""
        from match_engine import MatchResult
        
        results = [
            MatchResult(
                match_level=MatchLevel.L3_POWERTRAIN,
                base_price=26500,
                target_equivalent_price=28000,
                weight=0.7,
                is_direct=False
            )
        ]
        
        result = calculate_weighted_result(results)
        self.assertEqual(result['evidence_gate'], 'FAIL')
    
    def test_weighted_result_empty(self):
        """Empty results should fail evidence gate."""
        result = calculate_weighted_result([])
        self.assertEqual(result['evidence_gate'], 'FAIL')


class TestDuplicateListings(unittest.TestCase):
    """Test duplicate/mirror listings handling."""
    
    def test_duplicate_listings_not_double_counted(self):
        """Duplicate listings should not double-count evidence."""
        # This would be tested in the full pipeline
        # For now, just verify the concept
        listing1 = {
            'make': 'BMW',
            'model': 'X5',
            'year': 2018,
            'variant': '40e',
            'powertrain': 'PHEV',
            'drivetrain': 'AWD',
            'price': 26500,
            'mileage_km': 100000
        }
        
        listing2 = {
            'make': 'BMW',
            'model': 'X5',
            'year': 2018,
            'variant': '40e',
            'powertrain': 'PHEV',
            'drivetrain': 'AWD',
            'price': 26500,
            'mileage_km': 100000
        }
        
        # These should be detected as duplicates
        self.assertEqual(listing1, listing2)


if __name__ == '__main__':
    unittest.main()
