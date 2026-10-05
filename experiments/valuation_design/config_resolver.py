"""
Configuration Resolver for BMW X5 40e Valuation
Extracts structured configuration from listing description and specs.
"""
import re
from dataclasses import dataclass
from typing import Optional, List, Dict, Tuple


@dataclass
class Configuration:
    make: str
    model: str
    year: int
    variant: Optional[str] = None
    powertrain: Optional[str] = None  # 'PHEV', 'Hybrid', 'Gasoline', 'Diesel', 'Electric'
    engine_size: Optional[float] = None  # in Liters
    power_hp: Optional[int] = None
    drivetrain: Optional[str] = None  # 'AWD', 'RWD', 'FWD'
    transmission: Optional[str] = None  # 'Automatic', 'Manual'
    condition: Optional[str] = None  # 'Excellent', 'Good', 'Fair'
    mileage_km: Optional[int] = None
    raw_description: str = ""


class ConfigurationResolver:
    """Extracts structured configuration from listing description and specs."""
    
    # Powertrain patterns
    PHEV_PATTERNS = [
        r'plug[\s-]?in\s*hybrid',
        r'phev',
        r'40e',
        r'xDrive40e',
        r'x40e',
    ]
    
    HYBRID_PATTERNS = [
        r'\bhybrid\b',
        r'self[\s-]?charging',
    ]
    
    GASOLINE_PATTERNS = [
        r'\bgasoline\b',
        r'\bpetrol\b',
        r'\bgas\b',
    ]
    
    DIESEL_PATTERNS = [
        r'\bdiesel\b',
    ]
    
    ELECTRIC_PATTERNS = [
        r'\belectric\b',
        r'\bev\b',
        r'\bbev\b',
    ]
    
    # Drivetrain patterns
    AWD_PATTERNS = [
        r'\bawd\b',
        r'x[\s-]?drive',
        r'\bx\b\s*drive',
        r'4wd',
        r'4x4',
    ]
    
    RWD_PATTERNS = [
        r'\brwd\b',
        r'rear[\s-]?wheel\s*drive',
    ]
    
    FWD_PATTERNS = [
        r'\bfwd\b',
        r'front[\s-]?wheel\s*drive',
    ]
    
    # Transmission patterns
    AUTOMATIC_PATTERNS = [
        r'\bautomatic\b',
        r'\bauto\b',
        r'\bsteptronic\b',
        r'\btiptronic\b',
        r'\bdual[\s-]?clutch\b',
        r'\bdct\b',
    ]
    
    MANUAL_PATTERNS = [
        r'\bmanual\b',
        r'\bstick\b',
    ]
    
    # Condition patterns
    EXCELLENT_PATTERNS = [
        r'\bexcellent\b',
        r'\blike\s*new\b',
        r'\bnew\b',
        r'\bpristine\b',
    ]
    
    GOOD_PATTERNS = [
        r'\bgood\b',
        r'\bvery\s*good\b',
    ]
    
    FAIR_PATTERNS = [
        r'\bfair\b',
        r'\baverage\b',
        r'\bacceptable\b',
    ]
    
    # Variant patterns for X5
    X5_VARIANT_PATTERNS = {
        '40e': [r'\b40e\b', r'xDrive40e', r'x40e'],
        '35i': [r'\b35i\b', r'xDrive35i'],
        '40i': [r'\b40i\b', r'xDrive40i'],
        '50i': [r'\b50i\b', r'xDrive50i'],
        'M50i': [r'\bM50i\b'],
        'M50d': [r'\bM50d\b'],
        '30d': [r'\b30d\b', r'xDrive30d'],
        '40d': [r'\b40d\b', r'xDrive40d'],
    }
    
    def __init__(self):
        self.description = ""
        self.specs = {}
    
    def resolve(self, description: str, specs: Dict) -> Configuration:
        """Resolve configuration from description and specs."""
        self.description = description.lower()
        self.specs = {k: str(v).lower() if v else "" for k, v in specs.items()}
        
        # Extract basic fields
        make = self._extract_make()
        model = self._extract_model()
        year = self._extract_year()
        
        # Extract variant
        variant = self._extract_variant()
        
        # Extract powertrain
        powertrain = self._extract_powertrain()
        
        # Extract engine size
        engine_size = self._extract_engine_size()
        
        # Extract power
        power_hp = self._extract_power()
        
        # Extract drivetrain
        drivetrain = self._extract_drivetrain()
        
        # Extract transmission
        transmission = self._extract_transmission()
        
        # Extract condition
        condition = self._extract_condition()
        
        # Extract mileage
        mileage_km = self._extract_mileage()
        
        return Configuration(
            make=make,
            model=model,
            year=year,
            variant=variant,
            powertrain=powertrain,
            engine_size=engine_size,
            power_hp=power_hp,
            drivetrain=drivetrain,
            transmission=transmission,
            condition=condition,
            mileage_km=mileage_km,
            raw_description=description
        )
    
    def _extract_make(self) -> str:
        """Extract make from description or specs."""
        # Check specs first
        make = self.specs.get('make', '')
        if make:
            return make.title()
        
        # Check description
        if 'bmw' in self.description:
            return 'BMW'
        
        return 'Unknown'
    
    def _extract_model(self) -> str:
        """Extract model from description or specs."""
        # Check specs first
        model = self.specs.get('model', '')
        if model:
            return model.upper()
        
        # Check description
        if 'x5' in self.description:
            return 'X5'
        
        return 'Unknown'
    
    def _extract_year(self) -> int:
        """Extract year from description or specs."""
        # Check specs first
        year_str = self.specs.get('year', '')
        if year_str:
            try:
                return int(year_str)
            except ValueError:
                pass
        
        # Check description for 4-digit year
        year_match = re.search(r'\b(20\d{2})\b', self.description)
        if year_match:
            return int(year_match.group(1))
        
        return 0
    
    def _extract_variant(self) -> Optional[str]:
        """Extract variant (e.g., 40e, 35i, etc.)."""
        # Check description for X5 variants
        for variant, patterns in self.X5_VARIANT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, self.description, re.IGNORECASE):
                    return variant
        
        return None
    
    def _extract_powertrain(self) -> Optional[str]:
        """Extract powertrain type."""
        # Check PHEV first (most specific)
        for pattern in self.PHEV_PATTERNS:
            if re.search(pattern, self.description, re.IGNORECASE):
                return 'PHEV'
        
        # Check Hybrid
        for pattern in self.HYBRID_PATTERNS:
            if re.search(pattern, self.description, re.IGNORECASE):
                return 'Hybrid'
        
        # Check Electric
        for pattern in self.ELECTRIC_PATTERNS:
            if re.search(pattern, self.description, re.IGNORECASE):
                return 'Electric'
        
        # Check Diesel
        for pattern in self.DIESEL_PATTERNS:
            if re.search(pattern, self.description, re.IGNORECASE):
                return 'Diesel'
        
        # Check Gasoline
        for pattern in self.GASOLINE_PATTERNS:
            if re.search(pattern, self.description, re.IGNORECASE):
                return 'Gasoline'
        
        # Check specs
        fuel = self.specs.get('fuel_type', '')
        if 'hybrid' in fuel or 'plug' in fuel:
            return 'PHEV'
        elif 'electric' in fuel:
            return 'Electric'
        elif 'diesel' in fuel:
            return 'Diesel'
        elif 'gasoline' in fuel or 'petrol' in fuel:
            return 'Gasoline'
        
        return None
    
    def _extract_engine_size(self) -> Optional[float]:
        """Extract engine size in liters."""
        # Check description for engine size
        # Pattern: 2.0L, 2000cc, 2.0, etc.
        patterns = [
            r'(\d+\.?\d*)\s*[lL]',
            r'(\d{4})\s*cc',
            r'(\d+\.?\d*)\s*liter',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, self.description)
            if match:
                value = float(match.group(1))
                # Convert cc to liters
                if value > 100:
                    value = value / 1000
                return value
        
        # Check specs
        engine = self.specs.get('engine_size', '')
        if engine:
            try:
                return float(engine)
            except ValueError:
                pass
        
        return None
    
    def _extract_power(self) -> Optional[int]:
        """Extract power in HP."""
        # Check description for power
        patterns = [
            r'(\d+)\s*[hH][pP]',
            r'(\d+)\s*horsepower',
            r'(\d+)\s*ps',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, self.description)
            if match:
                return int(match.group(1))
        
        # Check specs
        power = self.specs.get('power_hp', '')
        if power:
            try:
                return int(power)
            except ValueError:
                pass
        
        return None
    
    def _extract_drivetrain(self) -> Optional[str]:
        """Extract drivetrain type."""
        # Check AWD first
        for pattern in self.AWD_PATTERNS:
            if re.search(pattern, self.description, re.IGNORECASE):
                return 'AWD'
        
        # Check RWD
        for pattern in self.RWD_PATTERNS:
            if re.search(pattern, self.description, re.IGNORECASE):
                return 'RWD'
        
        # Check FWD
        for pattern in self.FWD_PATTERNS:
            if re.search(pattern, self.description, re.IGNORECASE):
                return 'FWD'
        
        # Check specs
        drivetrain = self.specs.get('drivetrain', '')
        if 'awd' in drivetrain or '4wd' in drivetrain or 'x' in drivetrain:
            return 'AWD'
        elif 'rwd' in drivetrain:
            return 'RWD'
        elif 'fwd' in drivetrain:
            return 'FWD'
        
        return None
    
    def _extract_transmission(self) -> Optional[str]:
        """Extract transmission type."""
        # Check Automatic first
        for pattern in self.AUTOMATIC_PATTERNS:
            if re.search(pattern, self.description, re.IGNORECASE):
                return 'Automatic'
        
        # Check Manual
        for pattern in self.MANUAL_PATTERNS:
            if re.search(pattern, self.description, re.IGNORECASE):
                return 'Manual'
        
        # Check specs
        transmission = self.specs.get('transmission', '')
        if 'auto' in transmission:
            return 'Automatic'
        elif 'manual' in transmission:
            return 'Manual'
        
        return None
    
    def _extract_condition(self) -> Optional[str]:
        """Extract condition."""
        # Check Excellent first
        for pattern in self.EXCELLENT_PATTERNS:
            if re.search(pattern, self.description, re.IGNORECASE):
                return 'Excellent'
        
        # Check Good
        for pattern in self.GOOD_PATTERNS:
            if re.search(pattern, self.description, re.IGNORECASE):
                return 'Good'
        
        # Check Fair
        for pattern in self.FAIR_PATTERNS:
            if re.search(pattern, self.description, re.IGNORECASE):
                return 'Fair'
        
        # Check specs
        condition = self.specs.get('condition', '')
        if 'excellent' in condition:
            return 'Excellent'
        elif 'good' in condition:
            return 'Good'
        elif 'fair' in condition:
            return 'Fair'
        
        return None
    
    def _extract_mileage(self) -> Optional[int]:
        """Extract mileage in km."""
        # Check description for mileage
        patterns = [
            r'(\d+)\s*km',
            r'(\d+)\s*kilometers?',
            r'(\d{1,3}(?:,\d{3})*)\s*km',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, self.description)
            if match:
                # Remove commas
                value_str = match.group(1).replace(',', '')
                try:
                    return int(value_str)
                except ValueError:
                    pass
        
        # Check specs
        mileage = self.specs.get('mileage_km', '')
        if mileage:
            try:
                return int(mileage)
            except ValueError:
                pass
        
        return None


def normalize_variant(description: str) -> Optional[str]:
    """
    Normalize variant names to a canonical form.
    
    Examples:
    - "X5 40e" -> "40e"
    - "X5 xDrive40e" -> "40e"
    - "X5 Plug-in Hybrid 40e" -> "40e"
    - "BMW X5 40e xDrive" -> "40e"
    """
    desc_lower = description.lower()
    
    # Check for 40e variants
    if re.search(r'\b40e\b', desc_lower) or re.search(r'xdrive40e', desc_lower) or re.search(r'x40e', desc_lower):
        return '40e'
    
    # Check for other variants
    variants = ['35i', '40i', '50i', 'M50i', 'M50d', '30d', '40d']
    for variant in variants:
        if re.search(rf'\b{variant}\b', desc_lower):
            return variant
    
    return None


def is_phev(description: str) -> bool:
    """Check if description indicates PHEV."""
    desc_lower = description.lower()
    phev_patterns = [
        r'plug[\s-]?in\s*hybrid',
        r'\bphev\b',
        r'\b40e\b',
        r'xdrive40e',
    ]
    for pattern in phev_patterns:
        if re.search(pattern, desc_lower):
            return True
    return False


def is_awd(description: str) -> bool:
    """Check if description indicates AWD."""
    desc_lower = description.lower()
    awd_patterns = [
        r'\bawd\b',
        r'x[\s-]?drive',
        r'\bx\b\s*drive',
        r'4wd',
        r'4x4',
    ]
    for pattern in awd_patterns:
        if re.search(pattern, desc_lower):
            return True
    return False


def is_gasoline(description: str) -> bool:
    """Check if description indicates Gasoline-only (not hybrid)."""
    desc_lower = description.lower()
    
    # If it's PHEV or hybrid, it's not gasoline-only
    if is_phev(desc_lower):
        return False
    
    gasoline_patterns = [
        r'\bgasoline\b',
        r'\bpetrol\b',
        r'\bgas\b',
    ]
    for pattern in gasoline_patterns:
        if re.search(pattern, desc_lower):
            return True
    
    return False


def validate_price(price_text: str) -> Optional[int]:
    """
    Validate and parse price from text.
    
    Returns None if price is invalid (e.g., 0 when valid price exists later).
    """
    if not price_text:
        return None
    
    # Remove non-numeric characters except dots and commas
    cleaned = re.sub(r'[^\d.,]', '', price_text)
    
    # Remove commas
    cleaned = cleaned.replace(',', '')
    
    # Parse as float first (in case of decimals)
    try:
        price = float(cleaned)
    except ValueError:
        return None
    
    # Convert to int
    price_int = int(price)
    
    # Reject 0 as invalid placeholder
    if price_int == 0:
        return None
    
    return price_int


def extract_price_from_description(description: str) -> Optional[int]:
    """
    Extract price from description text.
    
    Handles cases like:
    - "Price: 30,000 JOD"
    - "30000 JOD"
    - "Price: 0" (invalid placeholder)
    """
    # Look for price patterns
    patterns = [
        r'price[:\s]*(\d{1,3}(?:,\d{3})*)\s*(?:jod|دينار)?',
        r'(\d{1,3}(?:,\d{3})*)\s*(?:jod|دينار)',
        r'(\d{5,6})\s*(?:jod|دينار)?',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, description.lower())
        for match in matches:
            # Remove commas
            value_str = match.replace(',', '')
            try:
                price = int(value_str)
                # Reject 0 as invalid placeholder
                if price > 0:
                    return price
            except ValueError:
                continue
    
    return None
