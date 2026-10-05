"""
Match Engine for BMW X5 40e Valuation
Implements L1-L7 match hierarchy with calibrated adjustments.
"""
import re
import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Tuple, Any
from enum import Enum


class MatchLevel(Enum):
    """Match hierarchy levels."""
    L1_EXACT = "L1"  # X5 + 2018 + 40e/PHEV + AWD
    L2_VARIANT_FAMILY = "L2"  # X5 + 2018 + PHEV + AWD
    L3_POWERTRAIN = "L3"  # X5 + 2018 + PHEV
    L4_YEAR_RANGE = "L4"  # X5 + 2017-2019 + PHEV
    L5_MODEL_RANGE = "L5"  # X5 + 2016-2020 + Hybrid/PHEV
    L6_NEIGHBORING = "L6"  # X5 neighboring configurations
    L7_FAMILY = "L7"  # BMW SUV family
    NO_MATCH = "NO_MATCH"


@dataclass
class MatchResult:
    """Result of matching a comparable to target."""
    match_level: MatchLevel
    match_reasons: List[str] = field(default_factory=list)
    mismatch_reasons: List[str] = field(default_factory=list)
    base_price: Optional[float] = None
    adjustments: Dict[str, Any] = field(default_factory=dict)
    target_equivalent_price: Optional[float] = None
    weight: float = 0.0
    is_direct: bool = False


class MatchEngine:
    """Match engine implementing L1-L7 hierarchy."""
    
    def __init__(self, target_config: Dict[str, Any]):
        self.target = target_config
        self.target_year = target_config.get('year', 0)
        self.target_variant = target_config.get('variant')
        self.target_powertrain = target_config.get('powertrain')
        self.target_drivetrain = target_config.get('drivetrain')
        self.target_transmission = target_config.get('transmission')
        self.target_condition = target_config.get('condition')
        self.target_mileage = target_config.get('mileage_km')
    
    def match(self, comparable: Dict[str, Any]) -> MatchResult:
        """Match a comparable to the target configuration."""
        result = MatchResult(match_level=MatchLevel.NO_MATCH)
        
        # Extract comparable attributes
        comp_make = comparable.get('make', '').upper()
        comp_model = comparable.get('model', '').upper()
        comp_year = comparable.get('year', 0)
        comp_variant = comparable.get('variant')
        comp_powertrain = comparable.get('powertrain')
        comp_drivetrain = comparable.get('drivetrain')
        comp_transmission = comparable.get('transmission')
        comp_condition = comparable.get('condition')
        comp_mileage = comparable.get('mileage_km')
        comp_price = comparable.get('price')
        
        # Check if it's a BMW
        if comp_make != 'BMW':
            result.mismatch_reasons.append(f"Not BMW (make={comp_make})")
            return result
        
        result.match_reasons.append("BMW")
        
        # Check if it's an X5
        if comp_model != 'X5':
            # L7: BMW SUV family (non-X5 BMW)
            result.match_level = MatchLevel.L7_FAMILY
            result.match_reasons.append("L7: BMW SUV family (non-X5)")
            result.is_direct = False
            result.weight = 0.05
            result.base_price = comp_price
            return result
        
        result.match_reasons.append("X5")
        
        # L1: Exact match (X5 + 2018 + 40e/PHEV + AWD)
        if self._is_l1_match(comp_year, comp_variant, comp_powertrain, comp_drivetrain):
            result.match_level = MatchLevel.L1_EXACT
            result.match_reasons.append("L1: Exact match (2018 + 40e/PHEV + AWD)")
            result.is_direct = True
            result.weight = 1.0
        # L2: Variant family (X5 + 2018 + PHEV + AWD, no variant specified)
        elif self._is_l2_match(comp_year, comp_variant, comp_powertrain, comp_drivetrain):
            result.match_level = MatchLevel.L2_VARIANT_FAMILY
            result.match_reasons.append("L2: Variant family (2018 + PHEV + AWD, no variant)")
            result.is_direct = True
            result.weight = 0.9
        # L3: Powertrain match (X5 + 2018 + PHEV)
        elif self._is_l3_match(comp_year, comp_powertrain):
            result.match_level = MatchLevel.L3_POWERTRAIN
            result.match_reasons.append("L3: Powertrain match (2018 + PHEV)")
            result.is_direct = False
            result.weight = 0.7
        # L4: Year range (X5 + 2017-2019 + PHEV)
        elif self._is_l4_match(comp_year, comp_powertrain):
            result.match_level = MatchLevel.L4_YEAR_RANGE
            result.match_reasons.append("L4: Year range (2017-2019 + PHEV)")
            result.is_direct = False
            result.weight = 0.5
        # L5: Model range (X5 + 2016-2020 + Hybrid/PHEV)
        elif self._is_l5_match(comp_year, comp_powertrain):
            result.match_level = MatchLevel.L5_MODEL_RANGE
            result.match_reasons.append("L5: Model range (2016-2020 + Hybrid/PHEV)")
            result.is_direct = False
            result.weight = 0.3
        # L6: Neighboring configurations (X5 other years)
        elif self._is_l6_match(comp_year):
            result.match_level = MatchLevel.L6_NEIGHBORING
            result.match_reasons.append("L6: Neighboring configuration (X5 other years)")
            result.is_direct = False
            result.weight = 0.15
        else:
            result.mismatch_reasons.append("No match")
            return result
        
        # Check mismatches
        self._check_mismatches(result, comp_year, comp_variant, comp_powertrain, 
                              comp_drivetrain, comp_transmission, comp_condition, comp_mileage)
        
        # Set base price
        result.base_price = comp_price
        
        return result
    
    def _is_l1_match(self, year: int, variant: Optional[str], 
                     powertrain: Optional[str], drivetrain: Optional[str]) -> bool:
        """L1: X5 + 2018 + 40e/PHEV + AWD."""
        if year != 2018:
            return False
        if powertrain != 'PHEV':
            return False
        if drivetrain != 'AWD':
            return False
        # Variant must be explicitly 40e for L1
        if variant != '40e':
            return False
        return True
    
    def _is_l2_match(self, year: int, variant: Optional[str], 
                     powertrain: Optional[str], drivetrain: Optional[str]) -> bool:
        """L2: X5 + 2018 + PHEV + AWD (no variant specified)."""
        if year != 2018:
            return False
        if powertrain != 'PHEV':
            return False
        if drivetrain != 'AWD':
            return False
        # L2 is when variant is None (not explicitly 40e)
        if variant is None:
            return True
        return False
    
    def _is_l3_match(self, year: int, powertrain: Optional[str]) -> bool:
        """L3: X5 + 2018 + PHEV."""
        if year != 2018:
            return False
        if powertrain != 'PHEV':
            return False
        return True
    
    def _is_l4_match(self, year: int, powertrain: Optional[str]) -> bool:
        """L4: X5 + 2017-2019 + PHEV."""
        if year not in [2017, 2018, 2019]:
            return False
        if powertrain != 'PHEV':
            return False
        return True
    
    def _is_l5_match(self, year: int, powertrain: Optional[str]) -> bool:
        """L5: X5 + 2016-2020 + Hybrid/PHEV."""
        if year not in [2016, 2017, 2018, 2019, 2020]:
            return False
        if powertrain not in ['Hybrid', 'PHEV']:
            return False
        return True
    
    def _is_l6_match(self, year: int) -> bool:
        """L6: X5 neighboring configurations."""
        # Any X5 from 2015-2021
        if year in [2015, 2016, 2017, 2018, 2019, 2020, 2021]:
            return True
        return False
    
    def _check_mismatches(self, result: MatchResult, year: int, variant: Optional[str],
                         powertrain: Optional[str], drivetrain: Optional[str],
                         transmission: Optional[str], condition: Optional[str],
                         mileage: Optional[int]) -> None:
        """Check for mismatches between comparable and target."""
        if year != self.target_year:
            result.mismatch_reasons.append(f"Year mismatch: {year} vs {self.target_year}")
        
        if variant != self.target_variant:
            result.mismatch_reasons.append(f"Variant mismatch: {variant} vs {self.target_variant}")
        
        if powertrain != self.target_powertrain:
            result.mismatch_reasons.append(f"Powertrain mismatch: {powertrain} vs {self.target_powertrain}")
        
        if drivetrain != self.target_drivetrain:
            result.mismatch_reasons.append(f"Drivetrain mismatch: {drivetrain} vs {self.target_drivetrain}")
        
        if transmission != self.target_transmission:
            result.mismatch_reasons.append(f"Transmission mismatch: {transmission} vs {self.target_transmission}")
        
        if condition != self.target_condition:
            result.mismatch_reasons.append(f"Condition mismatch: {condition} vs {self.target_condition}")
        
        if mileage and self.target_mileage:
            mileage_diff = abs(mileage - self.target_mileage)
            if mileage_diff > 50000:
                result.mismatch_reasons.append(f"Large mileage difference: {mileage} vs {self.target_mileage}")
            elif mileage_diff > 10000:
                result.mismatch_reasons.append(f"Mileage difference: {mileage} vs {self.target_mileage}")


class PriceAdjustmentEngine:
    """
    Calibrated price adjustment engine.
    All adjustments must be calibrated from training data.
    No invented coefficients.
    """
    
    def __init__(self, training_data: pd.DataFrame):
        self.training_data = training_data
        self.adjustments = {}
        self._calibrate_adjustments()
    
    def _calibrate_adjustments(self) -> None:
        """Calibrate adjustments from training data."""
        # Year adjustment: price difference per year
        if 'year' in self.training_data.columns and 'price' in self.training_data.columns:
            year_groups = self.training_data.groupby('year')['price'].median()
            if len(year_groups) > 1:
                # Calculate year coefficient using linear regression
                years = year_groups.index.values
                prices = year_groups.values
                # Simple linear regression: price = a + b*year
                A = np.column_stack([np.ones(len(years)), years])
                coeffs = np.linalg.lstsq(A, prices, rcond=None)[0]
                self.adjustments['year'] = {
                    'coefficient': coeffs[1],  # price change per year
                    'available': True,
                    'method': 'linear_regression',
                    'n_observations': len(years)
                }
            else:
                self.adjustments['year'] = {'available': False, 'reason': 'insufficient_data'}
        else:
            self.adjustments['year'] = {'available': False, 'reason': 'missing_columns'}
        
        # Mileage adjustment: price difference per 10,000 km
        if 'mileage_km' in self.training_data.columns and 'price' in self.training_data.columns:
            valid_mileage = self.training_data.dropna(subset=['mileage_km'])
            if len(valid_mileage) > 10:
                # Bin mileage and calculate median price per bin
                valid_mileage = valid_mileage.copy()
                valid_mileage['mileage_bin'] = pd.cut(valid_mileage['mileage_km'], bins=5)
                mileage_groups = valid_mileage.groupby('mileage_bin')['price'].median()
                if len(mileage_groups) > 1:
                    # Calculate mileage coefficient
                    bin_centers = [interval.mid for interval in mileage_groups.index]
                    prices = mileage_groups.values
                    A = np.column_stack([np.ones(len(bin_centers)), bin_centers])
                    coeffs = np.linalg.lstsq(A, prices, rcond=None)[0]
                    self.adjustments['mileage'] = {
                        'coefficient': coeffs[1],  # price change per km
                        'available': True,
                        'method': 'binned_regression',
                        'n_observations': len(valid_mileage)
                    }
                else:
                    self.adjustments['mileage'] = {'available': False, 'reason': 'insufficient_bins'}
            else:
                self.adjustments['mileage'] = {'available': False, 'reason': 'insufficient_data'}
        else:
            self.adjustments['mileage'] = {'available': False, 'reason': 'missing_columns'}
        
        # Powertrain adjustment: PHEV vs Gasoline
        if 'fuel_type' in self.training_data.columns and 'price' in self.training_data.columns:
            phev_data = self.training_data[self.training_data['fuel_type'].str.contains('Hybrid|Plug|PHEV', case=False, na=False)]
            gasoline_data = self.training_data[self.training_data['fuel_type'].str.contains('Gasoline|Petrol', case=False, na=False)]
            
            if len(phev_data) >= 5 and len(gasoline_data) >= 5:
                phev_median = phev_data['price'].median()
                gasoline_median = gasoline_data['price'].median()
                self.adjustments['powertrain'] = {
                    'phev_premium': phev_median - gasoline_median,
                    'available': True,
                    'method': 'median_difference',
                    'n_phev': len(phev_data),
                    'n_gasoline': len(gasoline_data)
                }
            else:
                self.adjustments['powertrain'] = {'available': False, 'reason': 'insufficient_data'}
        else:
            self.adjustments['powertrain'] = {'available': False, 'reason': 'missing_columns'}
        
        # Drivetrain adjustment: AWD vs RWD
        if 'drivetrain' in self.training_data.columns and 'price' in self.training_data.columns:
            awd_data = self.training_data[self.training_data['drivetrain'].str.contains('AWD|xDrive', case=False, na=False)]
            rwd_data = self.training_data[self.training_data['drivetrain'].str.contains('RWD', case=False, na=False)]
            
            if len(awd_data) >= 5 and len(rwd_data) >= 5:
                awd_median = awd_data['price'].median()
                rwd_median = rwd_data['price'].median()
                self.adjustments['drivetrain'] = {
                    'awd_premium': awd_median - rwd_median,
                    'available': True,
                    'method': 'median_difference',
                    'n_awd': len(awd_data),
                    'n_rwd': len(rwd_data)
                }
            else:
                self.adjustments['drivetrain'] = {'available': False, 'reason': 'insufficient_data'}
        else:
            self.adjustments['drivetrain'] = {'available': False, 'reason': 'missing_columns'}
        
        # Condition adjustment
        if 'condition' in self.training_data.columns and 'price' in self.training_data.columns:
            condition_groups = self.training_data.groupby('condition')['price'].median()
            if len(condition_groups) > 1:
                self.adjustments['condition'] = {
                    'medians': condition_groups.to_dict(),
                    'available': True,
                    'method': 'median_by_condition',
                    'n_observations': len(self.training_data)
                }
            else:
                self.adjustments['condition'] = {'available': False, 'reason': 'insufficient_data'}
        else:
            self.adjustments['condition'] = {'available': False, 'reason': 'missing_columns'}
    
    def calculate_adjustments(self, comparable: Dict[str, Any], target: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate price adjustments for a comparable to make it target-equivalent.
        
        Returns dict with adjustment details. If adjustment is not available,
        returns 'unavailable' with reason.
        """
        adjustments = {}
        
        # Year adjustment
        if 'year' in self.adjustments and self.adjustments['year']['available']:
            comp_year = comparable.get('year', 0)
            target_year = target.get('year', 0)
            year_diff = target_year - comp_year
            year_coeff = self.adjustments['year']['coefficient']
            year_adjustment = year_diff * year_coeff
            adjustments['year'] = {
                'value': year_adjustment,
                'available': True,
                'details': f"Year diff: {year_diff}, Coeff: {year_coeff:.2f}"
            }
        else:
            adjustments['year'] = {
                'value': None,
                'available': False,
                'reason': self.adjustments.get('year', {}).get('reason', 'unknown')
            }
        
        # Mileage adjustment
        if 'mileage' in self.adjustments and self.adjustments['mileage']['available']:
            comp_mileage = comparable.get('mileage_km')
            target_mileage = target.get('mileage_km')
            if comp_mileage and target_mileage:
                mileage_diff = target_mileage - comp_mileage
                mileage_coeff = self.adjustments['mileage']['coefficient']
                mileage_adjustment = mileage_diff * mileage_coeff
                adjustments['mileage'] = {
                    'value': mileage_adjustment,
                    'available': True,
                    'details': f"Mileage diff: {mileage_diff} km, Coeff: {mileage_coeff:.4f}/km"
                }
            else:
                adjustments['mileage'] = {
                    'value': None,
                    'available': False,
                    'reason': 'missing_mileage_data'
                }
        else:
            adjustments['mileage'] = {
                'value': None,
                'available': False,
                'reason': self.adjustments.get('mileage', {}).get('reason', 'unknown')
            }
        
        # Powertrain adjustment
        if 'powertrain' in self.adjustments and self.adjustments['powertrain']['available']:
            comp_powertrain = comparable.get('powertrain')
            target_powertrain = target.get('powertrain')
            if comp_powertrain == target_powertrain:
                adjustments['powertrain'] = {
                    'value': 0,
                    'available': True,
                    'details': 'Same powertrain'
                }
            else:
                # Apply PHEV premium if target is PHEV and comparable is not
                if target_powertrain == 'PHEV' and comp_powertrain != 'PHEV':
                    adjustments['powertrain'] = {
                        'value': self.adjustments['powertrain']['phev_premium'],
                        'available': True,
                        'details': f"PHEV premium: {self.adjustments['powertrain']['phev_premium']:.0f}"
                    }
                elif target_powertrain != 'PHEV' and comp_powertrain == 'PHEV':
                    adjustments['powertrain'] = {
                        'value': -self.adjustments['powertrain']['phev_premium'],
                        'available': True,
                        'details': f"PHEV discount: {-self.adjustments['powertrain']['phev_premium']:.0f}"
                    }
                else:
                    adjustments['powertrain'] = {
                        'value': None,
                        'available': False,
                        'reason': 'different_powertrain_not_calibrated'
                    }
        else:
            adjustments['powertrain'] = {
                'value': None,
                'available': False,
                'reason': self.adjustments.get('powertrain', {}).get('reason', 'unknown')
            }
        
        # Drivetrain adjustment
        if 'drivetrain' in self.adjustments and self.adjustments['drivetrain']['available']:
            comp_drivetrain = comparable.get('drivetrain')
            target_drivetrain = target.get('drivetrain')
            if comp_drivetrain == target_drivetrain:
                adjustments['drivetrain'] = {
                    'value': 0,
                    'available': True,
                    'details': 'Same drivetrain'
                }
            else:
                # Apply AWD premium if target is AWD and comparable is not
                if target_drivetrain == 'AWD' and comp_drivetrain != 'AWD':
                    adjustments['drivetrain'] = {
                        'value': self.adjustments['drivetrain']['awd_premium'],
                        'available': True,
                        'details': f"AWD premium: {self.adjustments['drivetrain']['awd_premium']:.0f}"
                    }
                elif target_drivetrain != 'AWD' and comp_drivetrain == 'AWD':
                    adjustments['drivetrain'] = {
                        'value': -self.adjustments['drivetrain']['awd_premium'],
                        'available': True,
                        'details': f"AWD discount: {-self.adjustments['drivetrain']['awd_premium']:.0f}"
                    }
                else:
                    adjustments['drivetrain'] = {
                        'value': None,
                        'available': False,
                        'reason': 'different_drivetrain_not_calibrated'
                    }
        else:
            adjustments['drivetrain'] = {
                'value': None,
                'available': False,
                'reason': self.adjustments.get('drivetrain', {}).get('reason', 'unknown')
            }
        
        # Condition adjustment
        if 'condition' in self.adjustments and self.adjustments['condition']['available']:
            comp_condition = comparable.get('condition')
            target_condition = target.get('condition')
            if comp_condition == target_condition:
                adjustments['condition'] = {
                    'value': 0,
                    'available': True,
                    'details': 'Same condition'
                }
            else:
                condition_medians = self.adjustments['condition']['medians']
                if comp_condition in condition_medians and target_condition in condition_medians:
                    comp_median = condition_medians[comp_condition]
                    target_median = condition_medians[target_condition]
                    condition_adjustment = target_median - comp_median
                    adjustments['condition'] = {
                        'value': condition_adjustment,
                        'available': True,
                        'details': f"Condition adjustment: {condition_adjustment:.0f}"
                    }
                else:
                    adjustments['condition'] = {
                        'value': None,
                        'available': False,
                        'reason': 'condition_not_in_training'
                    }
        else:
            adjustments['condition'] = {
                'value': None,
                'available': False,
                'reason': self.adjustments.get('condition', {}).get('reason', 'unknown')
            }
        
        return adjustments
    
    def calculate_target_equivalent_price(self, base_price: float, adjustments: Dict[str, Any]) -> Optional[float]:
        """
        Calculate target-equivalent price from base price and adjustments.
        
        Returns None if any required adjustment is unavailable.
        """
        if base_price is None or base_price <= 0:
            return None
        
        total_adjustment = 0
        for adj_name, adj_data in adjustments.items():
            if not adj_data.get('available', False):
                return None  # Cannot calculate if any adjustment is unavailable
            if adj_data.get('value') is None:
                return None
            total_adjustment += adj_data['value']
        
        return base_price + total_adjustment


def calculate_weighted_result(match_results: List[MatchResult]) -> Dict[str, Any]:
    """
    Calculate weighted result from multiple match results.
    
    Returns dict with weighted price, uncertainty, and evidence assessment.
    """
    if not match_results:
        return {
            'weighted_price': None,
            'uncertainty': None,
            'evidence_gate': 'FAIL',
            'reason': 'no_comparables'
        }
    
    # Filter results with valid target-equivalent prices
    valid_results = [r for r in match_results if r.target_equivalent_price is not None and r.weight > 0]
    
    if not valid_results:
        return {
            'weighted_price': None,
            'uncertainty': None,
            'evidence_gate': 'FAIL',
            'reason': 'no_valid_target_equivalent_prices'
        }
    
    # Calculate weighted average
    total_weight = sum(r.weight for r in valid_results)
    weighted_price = sum(r.target_equivalent_price * r.weight for r in valid_results) / total_weight
    
    # Calculate uncertainty (weighted standard deviation)
    variance = sum(r.weight * (r.target_equivalent_price - weighted_price) ** 2 for r in valid_results) / total_weight
    uncertainty = np.sqrt(variance)
    
    # Evidence gate: require at least one L1 or L2 match
    has_direct = any(r.is_direct for r in valid_results)
    has_l1 = any(r.match_level == MatchLevel.L1_EXACT for r in valid_results)
    
    if has_l1:
        evidence_gate = 'PASS'
    elif has_direct:
        evidence_gate = 'LIMITED'
    else:
        evidence_gate = 'FAIL'
    
    return {
        'weighted_price': weighted_price,
        'uncertainty': uncertainty,
        'evidence_gate': evidence_gate,
        'n_comparables': len(valid_results),
        'total_weight': total_weight,
        'has_l1': has_l1,
        'has_direct': has_direct
    }
