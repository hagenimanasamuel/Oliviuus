// backend/controllers/isanzure/searchController.js (Enhanced Version)

const { isanzureQuery } = require('../../config/isanzureDbConfig');

// ============================================
// ENHANCED LOCATION PARSING ENGINE
// ============================================

// Province normalization mapping
const PROVINCE_MAPPING = {
  // Full names
  'northern province': 'North',
  'southern province': 'South',
  'eastern province': 'East',
  'western province': 'West',
  'kigali province': 'Kigali',
  'kigali city': 'Kigali',

  // Common short forms
  'north': 'North',
  'south': 'South',
  'east': 'East',
  'west': 'West',
  'kigali': 'Kigali',

  // Kinyarwanda forms
  'intara y\'amajyaruguru': 'North',
  'intara y\'amajyepfo': 'South',
  'intara y\'iburasirazuba': 'East',
  'intara y\'uburengerazuba': 'West',
  'umujyi wa kigali': 'Kigali',

  // Common misspellings/variations
  'nothern': 'North',
  'northen': 'North',
  'southen': 'South',
  'southen': 'South',
  'easten': 'East',
  'westen': 'West',
  'kigali city': 'Kigali',
  'kigali town': 'Kigali'
};

// District normalization mapping (common variations)
const DISTRICT_MAPPING = {
  // Gasabo variations
  'gasabo': 'Gasabo',
  'gasabo district': 'Gasabo',
  'akarere ka gasabo': 'Gasabo',

  // Kicukiro variations
  'kicukiro': 'Kicukiro',
  'kicukiro district': 'Kicukiro',

  // Nyarugenge variations
  'nyarugenge': 'Nyarugenge',
  'nyarugenge district': 'Nyarugenge',

  // Musanze variations
  'musanze': 'Musanze',
  'musanze district': 'Musanze',
  'ruhengeri': 'Musanze', // Old name
  'muhoza': 'Muhoza', // But also a sector

  // Rubavu variations
  'rubavu': 'Rubavu',
  'rubavu district': 'Rubavu',
  'gisenyi': 'Rubavu', // Old name

  // Huye variations
  'huye': 'Huye',
  'huye district': 'Huye',
  'butare': 'Huye', // Old name

  // Karongi variations
  'karongi': 'Karongi',
  'karongi district': 'Karongi',
  'kibuye': 'Karongi', // Old name

  // Rusizi variations
  'rusizi': 'Rusizi',
  'rusizi district': 'Rusizi',
  'cyangugu': 'Rusizi', // Old name

  // Kayonza variations
  'kayonza': 'Kayonza',
  'kayonza district': 'Kayonza',

  // Nyagatare variations
  'nyagatare': 'Nyagatare',
  'nyagatare district': 'Nyagatare',

  // Gicumbi variations
  'gicumbi': 'Gicumbi',
  'gicumbi district': 'Gicumbi',
  'byumba': 'Gicumbi', // Old name

  // Rulindo variations
  'rulindo': 'Rulindo',
  'rulindo district': 'Rulindo',

  // Gakenke variations
  'gakenke': 'Gakenke',
  'gakenke district': 'Gakenke',

  // Burera variations
  'burera': 'Burera',
  'burera district': 'Burera',

  // Nyamasheke variations
  'nyamasheke': 'Nyamasheke',
  'nyamasheke district': 'Nyamasheke',

  // Nyamagabe variations
  'nyamagabe': 'Nyamagabe',
  'nyamagabe district': 'Nyamagabe',
  'gikongoro': 'Nyamagabe', // Old name

  // Nyaruguru variations
  'nyaruguru': 'Nyaruguru',
  'nyaruguru district': 'Nyaruguru',

  // Gisagara variations
  'gisagara': 'Gisagara',
  'gisagara district': 'Gisagara',

  // Kamonyi variations
  'kamonyi': 'Kamonyi',
  'kamonyi district': 'Kamonyi',

  // Muhanga variations
  'muhanga': 'Muhanga',
  'muhanga district': 'Muhanga',
  'gitarama': 'Muhanga', // Old name

  // Ruhango variations
  'ruhango': 'Ruhango',
  'ruhango district': 'Ruhango',

  // Ngoma variations
  'ngoma': 'Ngoma',
  'ngoma district': 'Ngoma',
  'kibungo': 'Ngoma', // Old name

  // Bugesera variations
  'bugesera': 'Bugesera',
  'bugesera district': 'Bugesera',

  // Rwamagana variations
  'rwamagana': 'Rwamagana',
  'rwamagana district': 'Rwamagana',

  // Kirche variations
  'kirche': 'Kirche',
  'kirche district': 'Kirche',

  // Gatsibo variations
  'gatsibo': 'Gatsibo',
  'gatsibo district': 'Gatsibo',

  // Nyabihu variations
  'nyabihu': 'Nyabihu',
  'nyabihu district': 'Nyabihu',

  // Ngororero variations
  'ngororero': 'Ngororero',
  'ngororero district': 'Ngororero',

  // Rutsiro variations
  'rutsiro': 'Rutsiro',
  'rutsiro district': 'Rutsiro',

  // Ruhango variations
  'ruhango': 'Ruhango',
  'ruhango district': 'Ruhango'
};

// ============================================
// ADVANCED QUERY PARSER
// ============================================

/**
 * Parse any search query into structured components
 * Handles: "Muhanga, South", "Karongi, Western Province", "Isibo Nyagatovu", etc.
 */
function parseAdvancedQuery(query) {
  if (!query || typeof query !== 'string') {
    return {
      original: '',
      cleaned: '',
      tokens: [],
      locationTerms: [],
      propertyTerms: [],
      isiboTokens: [],
      potentialProvince: null,
      potentialDistrict: null,
      potentialSector: null,
      potentialCell: null,
      potentialVillage: null,
      potentialIsibo: null,
      confidence: 0
    };
  }

  // Clean the query
  let cleaned = query.toLowerCase().trim();

  // Remove extra spaces and normalize punctuation
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Split by common separators: comma, 'and', 'in', 'at', 'mu', 'iya', 'ziri mu'
  const separators = [',', ' and ', ' in ', ' at ', ' mu ', ' iya ', ' ziri mu ', ' near ', ' hafi ya ', ' hafi na '];
  let tokens = [cleaned];

  separators.forEach(sep => {
    const newTokens = [];
    tokens.forEach(token => {
      if (token.includes(sep)) {
        token.split(sep).forEach(t => {
          if (t.trim()) newTokens.push(t.trim());
        });
      } else {
        newTokens.push(token);
      }
    });
    tokens = newTokens;
  });

  // Also split by spaces for word-level analysis
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);

  const result = {
    original: query,
    cleaned,
    tokens,
    words,
    locationTerms: [],
    propertyTerms: [],
    isiboTokens: [],
    potentialProvince: null,
    potentialDistrict: null,
    potentialSector: null,
    potentialCell: null,
    potentialVillage: null,
    potentialIsibo: null,
    confidence: 0
  };

  // Check each token for location/property type patterns
  tokens.forEach(token => {
    // Check if token matches province patterns
    const provinceMatch = matchProvince(token);
    if (provinceMatch) {
      result.potentialProvince = provinceMatch;
      result.locationTerms.push(token);
      result.confidence += 30;
    }

    // Check if token matches district patterns
    const districtMatch = matchDistrict(token);
    if (districtMatch) {
      result.potentialDistrict = districtMatch;
      result.locationTerms.push(token);
      result.confidence += 25;
    }

    // Check if token might be sector/cell/village (single word, capitalizable)
    if (token.length > 2 && !result.potentialSector && !provinceMatch && !districtMatch) {
      // Could be sector, cell, or village
      result.potentialSector = token;
      result.locationTerms.push(token);
      result.confidence += 15;
    }

    // Check if token contains "isibo" or similar patterns
    if (token.includes('isibo') || token.match(/^[A-Za-z]+$/i) && token.length > 3) {
      result.isiboTokens.push(token);
      result.potentialIsibo = token;
      result.confidence += 10;
    }

    // Check property types
    if (isPropertyType(token)) {
      result.propertyTerms.push(token);
      result.confidence += 20;
    }
  });

  // Special handling for patterns like "Muhanga, South" (district, province)
  if (tokens.length === 2 && result.potentialDistrict && result.potentialProvince) {
    result.confidence += 50;
  }

  // Pattern: "Karongi, Western Province" - should parse district and province
  if (tokens.length >= 2) {
    const combinedPattern = /(.+?)[,\s]+(.+)/.exec(cleaned);
    if (combinedPattern) {
      const firstPart = combinedPattern[1].trim();
      const secondPart = combinedPattern[2].trim();

      const firstMatch = matchDistrict(firstPart) || matchProvince(firstPart) || firstPart;
      const secondMatch = matchProvince(secondPart) || matchDistrict(secondPart) || secondPart;

      if (!result.potentialDistrict && matchDistrict(firstPart)) {
        result.potentialDistrict = matchDistrict(firstPart);
        result.confidence += 30;
      }
      if (!result.potentialProvince && matchProvince(secondPart)) {
        result.potentialProvince = matchProvince(secondPart);
        result.confidence += 30;
      }
    }
  }

  // Handle isibo searches (common pattern: "isibo X" or just the isibo name)
  const isiboPattern = /(?:isibo|inzu|urugo)[\s-]*([a-zA-Z\s]+)/i.exec(cleaned);
  if (isiboPattern) {
    result.potentialIsibo = isiboPattern[1].trim();
    result.isiboTokens.push(result.potentialIsibo);
    result.confidence += 40;
  }

  // If we have a single word with high confidence of being a specific location
  if (words.length === 1) {
    const word = words[0];

    // Check if it's a district (highest confidence for single word)
    const districtMatch = matchDistrict(word);
    if (districtMatch) {
      result.potentialDistrict = districtMatch;
      result.locationTerms.push(word);
      result.confidence = 80;
    }
    // Check if it's a province
    else if (matchProvince(word)) {
      result.potentialProvince = matchProvince(word);
      result.locationTerms.push(word);
      result.confidence = 70;
    }
    // Check if it might be a sector/cell/village
    else if (word.length > 3) {
      // Could be sector, cell, or village - we'll search all
      result.potentialSector = word;
      result.locationTerms.push(word);
      result.confidence = 50;
    }
  }

  return result;
}

/**
 * Match province names with fuzzy logic
 */
function matchProvince(token) {
  const normalized = token.toLowerCase().trim();

  // Direct match in mapping
  if (PROVINCE_MAPPING[normalized]) {
    return PROVINCE_MAPPING[normalized];
  }

  // Check if token contains province names
  const provinceKeywords = ['north', 'south', 'east', 'west', 'kigali', 'northern', 'southern', 'eastern', 'western'];
  for (const keyword of provinceKeywords) {
    if (normalized.includes(keyword)) {
      // Map to correct province name
      if (keyword.includes('north')) return 'North';
      if (keyword.includes('south')) return 'South';
      if (keyword.includes('east')) return 'East';
      if (keyword.includes('west')) return 'West';
      if (keyword.includes('kigali')) return 'Kigali';
    }
  }

  return null;
}

/**
 * Match district names with fuzzy logic
 */
function matchDistrict(token) {
  const normalized = token.toLowerCase().trim();

  // Direct match in mapping
  if (DISTRICT_MAPPING[normalized]) {
    return DISTRICT_MAPPING[normalized];
  }

  // Check for common district names with partial matching
  const commonDistricts = [
    'gasabo', 'kicukiro', 'nyarugenge', 'musanze', 'rubavu', 'huye',
    'karongi', 'rusizi', 'kayonza', 'nyagatare', 'gicumbi', 'rulindo',
    'gakenke', 'burera', 'nyamasheke', 'nyamagabe', 'nyaruguru', 'gisagara',
    'kamonyi', 'muhanga', 'ruhango', 'ngoma', 'bugesera', 'rwamagana',
    'kirche', 'gatsibo', 'nyabihu', 'ngororero', 'rutsiro', 'nyanza'
  ];

  // Check if token is very similar to any district
  for (const district of commonDistricts) {
    if (normalized === district ||
      normalized.includes(district) ||
      district.includes(normalized) ||
      levenshteinDistance(normalized, district) < 3) {
      return district.charAt(0).toUpperCase() + district.slice(1);
    }
  }

  return null;
}

/**
 * Check if token is a property type
 */
function isPropertyType(token) {
  const propertyTypes = [
    'apartment', 'house', 'villa', 'condo', 'studio', 'penthouse',
    'townhouse', 'ghetto', 'living house', 'upmarket', 'service apartment',
    'guest house', 'bungalow', 'commercial', 'hostel', 'farm', 'land'
  ];

  const normalized = token.toLowerCase().trim();

  return propertyTypes.some(type =>
    normalized === type ||
    normalized.includes(type) ||
    type.includes(normalized)
  );
}

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// ============================================
// ENHANCED INTELLIGENT SEARCH
// ============================================

/**
 * Intelligent search with advanced parsing
 */
exports.intelligentSearch = async (req, res) => {
  try {
    const { query = '', userProvince, userDistrict, limit = 15 } = req.query;

    if (!query.trim()) {
      return res.status(200).json({
        success: true,
        suggestions: [],
        categories: []
      });
    }

    console.log(`🤖 Enhanced intelligent search for: "${query}"`);

    // Parse the query with our advanced parser
    const parsedQuery = parseAdvancedQuery(query);
    console.log('📊 Parsed query:', JSON.stringify(parsedQuery, null, 2));

    const searchTerm = `%${query}%`;
    const results = {
      locations: [],
      properties: [],
      landmarks: [],
      propertyTypes: [],
      exactMatches: [],
      fuzzyMatches: []
    };

    // 1. EXACT LOCATION MATCHES (highest priority)
    // Search for exact district matches first
    if (parsedQuery.potentialDistrict) {
      const exactDistrictSql = `
        SELECT 
          district as name,
          CONCAT(district, ', ', province) as fullName,
          'district' as type,
          '🏙️' as icon,
          'District' as description,
          COUNT(*) as count,
          100 as match_score
        FROM properties
        WHERE status = 'active' AND district = ?
        GROUP BY district, province
        ORDER BY count DESC
        LIMIT 5
      `;

      const exactDistricts = await isanzureQuery(exactDistrictSql, [parsedQuery.potentialDistrict]);
      results.exactMatches.push(...exactDistricts);
    }

    // Search for exact province matches
    if (parsedQuery.potentialProvince) {
      const exactProvinceSql = `
        SELECT 
          province as name,
          province as fullName,
          'province' as type,
          '🗺️' as icon,
          'Province' as description,
          COUNT(*) as count,
          90 as match_score
        FROM properties
        WHERE status = 'active' AND province = ?
        GROUP BY province
        LIMIT 5
      `;

      const exactProvinces = await isanzureQuery(exactProvinceSql, [parsedQuery.potentialProvince]);
      results.exactMatches.push(...exactProvinces);
    }

    // Search for sector/cell/village matches
    if (parsedQuery.potentialSector) {
      // Search in sector
      const sectorSql = `
        SELECT 
          sector as name,
          CONCAT(sector, ', ', district) as fullName,
          'sector' as type,
          '📍' as icon,
          'Sector' as description,
          COUNT(*) as count,
          80 as match_score
        FROM properties
        WHERE status = 'active' AND sector LIKE ?
        GROUP BY sector, district
        LIMIT 5
      `;

      const sectors = await isanzureQuery(sectorSql, [`%${parsedQuery.potentialSector}%`]);
      results.exactMatches.push(...sectors);

      // Also search in cell
      const cellSql = `
        SELECT 
          cell as name,
          CONCAT(cell, ', ', sector) as fullName,
          'cell' as type,
          '🏘️' as icon,
          'Cell' as description,
          COUNT(*) as count,
          75 as match_score
        FROM properties
        WHERE status = 'active' AND cell LIKE ?
        GROUP BY cell, sector
        LIMIT 5
      `;

      const cells = await isanzureQuery(cellSql, [`%${parsedQuery.potentialSector}%`]);
      results.exactMatches.push(...cells);

      // Search in village
      const villageSql = `
        SELECT 
          village as name,
          CONCAT(village, ', ', cell) as fullName,
          'village' as type,
          '🏠' as icon,
          'Village' as description,
          COUNT(*) as count,
          70 as match_score
        FROM properties
        WHERE status = 'active' AND village LIKE ?
        GROUP BY village, cell
        LIMIT 5
      `;

      const villages = await isanzureQuery(villageSql, [`%${parsedQuery.potentialSector}%`]);
      results.exactMatches.push(...villages);
    }

    // Search for isibo matches
    if (parsedQuery.potentialIsibo) {
      const isiboSql = `
        SELECT 
          isibo as name,
          CONCAT(isibo, ', ', village, ', ', cell) as fullName,
          'isibo' as type,
          '🏘️' as icon,
          'Isibo/Neighborhood' as description,
          COUNT(*) as count,
          95 as match_score
        FROM properties
        WHERE status = 'active' AND isibo LIKE ?
        GROUP BY isibo, village, cell
        LIMIT 10
      `;

      const isibos = await isanzureQuery(isiboSql, [`%${parsedQuery.potentialIsibo}%`]);
      results.exactMatches.push(...isibos);
    }

    // 2. SIMPLIFIED FUZZY LOCATION SEARCH (works reliably)
    if (results.exactMatches.length < 3 && parsedQuery.words.length > 0) {
      // For each word, try a simple search
      for (const word of parsedQuery.words) {
        if (word.length < 3) continue;

        const pattern = `%${word}%`;

        // Search provinces
        const provinceSql = `
      SELECT DISTINCT 
        province as name,
        province as fullName,
        'province' as type,
        '🗺️' as icon,
        'Province' as description,
        COUNT(*) as count,
        50 as match_score
      FROM properties
      WHERE status = 'active' AND province LIKE ?
      GROUP BY province
      ORDER BY count DESC
      LIMIT 2
    `;

        const provinces = await isanzureQuery(provinceSql, [pattern]);
        results.fuzzyMatches.push(...provinces);

        // Search districts
        const districtSql = `
      SELECT DISTINCT 
        district as name,
        CONCAT(district, ', ', province) as fullName,
        'district' as type,
        '🏙️' as icon,
        'District' as description,
        COUNT(*) as count,
        50 as match_score
      FROM properties
      WHERE status = 'active' AND district LIKE ?
      GROUP BY district, province
      ORDER BY count DESC
      LIMIT 3
    `;

        const districts = await isanzureQuery(districtSql, [pattern]);
        results.fuzzyMatches.push(...districts);

        // Search sectors
        const sectorSql = `
      SELECT DISTINCT 
        sector as name,
        CONCAT(sector, ', ', district) as fullName,
        'sector' as type,
        '📍' as icon,
        'Sector' as description,
        COUNT(*) as count,
        50 as match_score
      FROM properties
      WHERE status = 'active' AND sector LIKE ?
      GROUP BY sector, district
      ORDER BY count DESC
      LIMIT 3
    `;

        const sectors = await isanzureQuery(sectorSql, [pattern]);
        results.fuzzyMatches.push(...sectors);

        // Search cells
        const cellSql = `
      SELECT DISTINCT 
        cell as name,
        CONCAT(cell, ', ', sector) as fullName,
        'cell' as type,
        '🏘️' as icon,
        'Cell' as description,
        COUNT(*) as count,
        50 as match_score
      FROM properties
      WHERE status = 'active' AND cell LIKE ?
      GROUP BY cell, sector
      ORDER BY count DESC
      LIMIT 3
    `;

        const cells = await isanzureQuery(cellSql, [pattern]);
        results.fuzzyMatches.push(...cells);

        // Search villages
        const villageSql = `
      SELECT DISTINCT 
        village as name,
        CONCAT(village, ', ', cell) as fullName,
        'village' as type,
        '🏠' as icon,
        'Village' as description,
        COUNT(*) as count,
        50 as match_score
      FROM properties
      WHERE status = 'active' AND village LIKE ?
      GROUP BY village, cell
      ORDER BY count DESC
      LIMIT 3
    `;

        const villages = await isanzureQuery(villageSql, [pattern]);
        results.fuzzyMatches.push(...villages);

        // Search isibo
        const isiboSql = `
      SELECT DISTINCT 
        isibo as name,
        CONCAT(isibo, ', ', village) as fullName,
        'isibo' as type,
        '🏘️' as icon,
        'Isibo' as description,
        COUNT(*) as count,
        50 as match_score
      FROM properties
      WHERE status = 'active' AND isibo LIKE ?
      GROUP BY isibo, village
      ORDER BY count DESC
      LIMIT 3
    `;

        const isibos = await isanzureQuery(isiboSql, [pattern]);
        results.fuzzyMatches.push(...isibos);
      }

      // Remove duplicates from fuzzy matches
      const seen = new Set();
      results.fuzzyMatches = results.fuzzyMatches.filter(match => {
        if (!match.name) return false;
        const key = `${match.type}:${match.name}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // 3. PROPERTY TYPE SEARCH - FIXED: use for...of loop with async
    if (parsedQuery.propertyTerms.length > 0 && !results.exactMatches.some(m => m.type === 'property_type')) {
      for (const term of parsedQuery.propertyTerms) {
        const typeSql = `
          SELECT 
            property_type as name,
            CONCAT(UPPER(SUBSTRING(property_type, 1, 1)), SUBSTRING(property_type, 2)) as fullName,
            'property_type' as type,
            '🏠' as icon,
            'Property Type' as description,
            COUNT(*) as count,
            60 as match_score
          FROM properties
          WHERE status = 'active' AND property_type LIKE ?
          GROUP BY property_type
          ORDER BY count DESC
          LIMIT 3
        `;

        const types = await isanzureQuery(typeSql, [`%${term}%`]);
        results.propertyTypes.push(...types);
      }
    }

    // 4. LANDMARK SEARCH - FIXED: use for...of loop with async
    const landmarkSql = `
      SELECT 
        attraction_name as name,
        attraction_name as fullName,
        'landmark' as type,
        CASE attraction_type
          WHEN 'school' THEN '🎓'
          WHEN 'hospital' THEN '🏥'
          WHEN 'market' THEN '🛒'
          WHEN 'transport' THEN '🚌'
          WHEN 'park' THEN '🌳'
          ELSE '📍'
        END as icon,
        CONCAT(UPPER(SUBSTRING(attraction_type, 1, 1)), SUBSTRING(attraction_type, 2)) as description,
        COUNT(*) as count,
        55 as match_score
      FROM property_nearby_attractions
      WHERE attraction_name LIKE ?
      GROUP BY attraction_name, attraction_type
      ORDER BY count DESC
      LIMIT 5
    `;

    for (const word of parsedQuery.words) {
      if (word.length > 2) {
        const landmarks = await isanzureQuery(landmarkSql, [`%${word}%`]);
        results.landmarks.push(...landmarks);
      }
    }

    // 5. PROPERTY PREVIEWS (for quick results)
    if (parsedQuery.words.length > 0) {
      const propertyConditions = [];
      const propertyValues = [];

      parsedQuery.words.forEach(word => {
        propertyConditions.push(`(p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ?)`);
        const pattern = `%${word}%`;
        propertyValues.push(pattern, pattern, pattern);
      });

      const propertyPreviewSql = `
        SELECT 
          p.title as name,
          CONCAT(p.title, ' - ', p.district) as fullName,
          'property' as type,
          '🏠' as icon,
          CONCAT(UPPER(SUBSTRING(p.property_type, 1, 1)), SUBSTRING(p.property_type, 2), ' in ', p.district) as description,
          1 as count,
          45 as match_score,
          p.property_uid,
          p.property_type,
          p.district,
          p.sector,
          pp.monthly_price,
          (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as image
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.status = 'active'
          AND (${propertyConditions.join(' OR ')})
        ORDER BY p.is_featured DESC, p.is_verified DESC, p.created_at DESC
        LIMIT 5
      `;

      const properties = await isanzureQuery(propertyPreviewSql, propertyValues);
      results.properties = properties;
    }

    // Combine and deduplicate all results
    const allSuggestions = [
      ...results.exactMatches,
      ...results.fuzzyMatches,
      ...results.propertyTypes,
      ...results.landmarks,
      ...results.properties
    ];

    // Remove duplicates (by name and type)
    const seen = new Set();
    const uniqueSuggestions = allSuggestions.filter(suggestion => {
      const key = `${suggestion.type}:${suggestion.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by match_score (highest first)
    uniqueSuggestions.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

    // Get unique categories
    const categories = [...new Set(uniqueSuggestions.map(s => s.type))];

    // Generate "did you mean" suggestions
    const didYouMean = await generateDidYouMean(query, uniqueSuggestions, parsedQuery);

    res.status(200).json({
      success: true,
      query,
      parsed: parsedQuery,
      suggestions: uniqueSuggestions.slice(0, limit),
      categories,
      didYouMean,
      intelligentFeatures: {
        hasLocationContext: !!(userProvince || userDistrict),
        parsedTerms: parsedQuery.words,
        locationTerms: parsedQuery.locationTerms,
        isiboTokens: parsedQuery.isiboTokens,
        confidence: parsedQuery.confidence,
        searchPattern: analyzeSearchPatternEnhanced(query, parsedQuery)
      }
    });

  } catch (error) {
    console.error('❌ Error in intelligentSearch:', error);
    res.status(200).json({
      success: true,
      suggestions: [],
      categories: []
    });
  }
};

/**
 * Generate "did you mean" suggestions
 */
async function generateDidYouMean(originalQuery, suggestions, parsedQuery) {
  const didYouMean = [];

  if (suggestions.length === 0) {
    // No results - suggest popular alternatives
    const popularSql = `
      SELECT district as name, province
      FROM properties
      WHERE status = 'active'
      GROUP BY district, province
      ORDER BY COUNT(*) DESC
      LIMIT 3
    `;

    const popular = await isanzureQuery(popularSql);
    popular.forEach(p => {
      didYouMean.push({
        original: originalQuery,
        suggestion: p.name,
        type: 'popular_location',
        reason: 'Try searching in a popular area'
      });
    });
  }

  return didYouMean;
}

/**
 * Enhanced search pattern analysis
 */
function analyzeSearchPatternEnhanced(query, parsedQuery) {
  const patterns = {
    type: 'general',
    confidence: parsedQuery.confidence,
    components: []
  };

  if (!query) return patterns;

  // Check for location searches
  if (parsedQuery.potentialDistrict) {
    patterns.type = 'district_search';
    patterns.components.push('district');
  }

  if (parsedQuery.potentialProvince) {
    patterns.type = patterns.type === 'general' ? 'province_search' : 'location_hierarchy';
    patterns.components.push('province');
  }

  if (parsedQuery.potentialSector && !parsedQuery.potentialDistrict) {
    patterns.type = 'sector_search';
    patterns.components.push('sector');
  }

  if (parsedQuery.potentialIsibo) {
    patterns.type = 'isibo_search';
    patterns.components.push('isibo');
  }

  // Check for property type searches
  if (parsedQuery.propertyTerms.length > 0) {
    patterns.type = patterns.type === 'general' ? 'property_search' : 'mixed_search';
    patterns.components.push('property_type');
  }

  // Check for comma-separated patterns
  if (query.includes(',')) {
    patterns.hasComma = true;
    patterns.type = 'structured_location';
  }

  return patterns;
}

// ============================================
// ENHANCED ADVANCED SEARCH
// ============================================

/**
 * Enhanced advanced search with better location handling
 */
exports.advancedSearch = async (req, res) => {
  try {
    const {
      query = '',
      province = null,
      district = null,
      sector = null,
      cell = null,
      village = null,
      isibo = null,
      minPrice = null,
      maxPrice = null,
      pricePeriod = 'monthly',
      propertyTypes = [],
      minBedrooms = null,
      minBathrooms = null,
      minGuests = null,
      minArea = null,
      amenities = [],
      nearbyAttractions = [],
      isVerified = false,
      isFeatured = false,
      hasImages = true,
      utilitiesIncluded = false,
      acceptNightly = null,
      acceptDaily = null,
      acceptWeekly = null,
      acceptMonthly = true,
      sortBy = 'relevance',
      limit = 50,
      offset = 0
    } = req.query;

    console.log('🔍 Enhanced Advanced Search Request:', {
      query,
      location: { province, district, sector, cell, village, isibo },
      price: { minPrice, maxPrice, period: pricePeriod },
      types: propertyTypes
    });

    // Parse the search query with our advanced parser
    const parsedQuery = parseAdvancedQuery(query);
    
    // Build dynamic WHERE conditions
    const conditions = ['p.status = "active"'];
    const values = [];

    // ============================================
    // 1. TEXT SEARCH WITH INTELLIGENT PARSING
    // ============================================
    if (parsedQuery && parsedQuery.words && parsedQuery.words.length > 0) {
      const textConditions = [];
      
      // If we have a potential district from parsing, prioritize it
      if (parsedQuery.potentialDistrict) {
        conditions.push('p.district = ?');
        values.push(parsedQuery.potentialDistrict);
      }
      
      // If we have a potential province, add it
      if (parsedQuery.potentialProvince) {
        conditions.push('p.province = ?');
        values.push(parsedQuery.potentialProvince);
      }
      
      // For other terms, do a broad search
      parsedQuery.words.forEach(term => {
        if (term && term.length > 2 && 
            term !== parsedQuery.potentialDistrict?.toLowerCase() && 
            term !== parsedQuery.potentialProvince?.toLowerCase()) {
          textConditions.push(`
            (p.title LIKE ? OR 
             p.description LIKE ? OR 
             p.address LIKE ? OR
             p.sector LIKE ? OR
             p.cell LIKE ? OR
             p.village LIKE ? OR
             p.isibo LIKE ?)
          `);
          const pattern = `%${term}%`;
          for (let i = 0; i < 7; i++) values.push(pattern);
        }
      });
      
      if (textConditions.length > 0) {
        conditions.push(`(${textConditions.join(' OR ')})`);
      }
    }

    // ============================================
    // 2. LOCATION HIERARCHY (with fallback)
    // ============================================
    if (province) {
      const dbProvince = mapProvinceToDb(province);
      conditions.push('p.province = ?');
      values.push(dbProvince);
    } else if (parsedQuery && parsedQuery.potentialProvince && !province) {
      conditions.push('p.province = ?');
      values.push(parsedQuery.potentialProvince);
    }
    
    if (district) {
      conditions.push('p.district = ?');
      values.push(district);
    } else if (parsedQuery && parsedQuery.potentialDistrict && !district) {
      conditions.push('p.district = ?');
      values.push(parsedQuery.potentialDistrict);
    }
    
    if (sector) {
      conditions.push('p.sector = ?');
      values.push(sector);
    } else if (parsedQuery && parsedQuery.potentialSector && !sector) {
      conditions.push('p.sector LIKE ?');
      values.push(`%${parsedQuery.potentialSector}%`);
    }
    
    if (cell) {
      conditions.push('p.cell = ?');
      values.push(cell);
    } else if (parsedQuery && parsedQuery.potentialCell && !cell) {
      conditions.push('p.cell LIKE ?');
      values.push(`%${parsedQuery.potentialCell}%`);
    }
    
    if (village) {
      conditions.push('p.village = ?');
      values.push(village);
    } else if (parsedQuery && parsedQuery.potentialVillage && !village) {
      conditions.push('p.village LIKE ?');
      values.push(`%${parsedQuery.potentialVillage}%`);
    }
    
    if (isibo) {
      conditions.push('p.isibo LIKE ?');
      values.push(`%${isibo}%`);
    } else if (parsedQuery && parsedQuery.potentialIsibo && !isibo) {
      conditions.push('p.isibo LIKE ?');
      values.push(`%${parsedQuery.potentialIsibo}%`);
    }

    // ============================================
    // 3. PRICE CONDITIONS
    // ============================================
    const priceColumn = `${pricePeriod}_price`;
    if (minPrice) {
      conditions.push(`pp.${priceColumn} >= ?`);
      values.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      conditions.push(`pp.${priceColumn} <= ?`);
      values.push(parseFloat(maxPrice));
    }

    // ============================================
    // 4. PROPERTY TYPES - FIXED: Check if propertyTypes is array
    // ============================================
    const propertyTypesArray = Array.isArray(propertyTypes) ? propertyTypes : 
                               (propertyTypes ? [propertyTypes] : []);
    
    const dbPropertyTypes = mapPropertyTypesToDb(propertyTypesArray);
    if (dbPropertyTypes && dbPropertyTypes.length > 0) {
      conditions.push(`p.property_type IN (${dbPropertyTypes.map(() => '?').join(',')})`);
      values.push(...dbPropertyTypes);
    } else if (parsedQuery && parsedQuery.propertyTerms && parsedQuery.propertyTerms.length > 0) {
      // Try to match property types from the query
      const typeConditions = [];
      parsedQuery.propertyTerms.forEach(term => {
        if (term) {
          typeConditions.push('p.property_type LIKE ?');
          values.push(`%${term}%`);
        }
      });
      if (typeConditions.length > 0) {
        conditions.push(`(${typeConditions.join(' OR ')})`);
      }
    }

    // ============================================
    // 5. ROOM CONDITIONS
    // ============================================
    if (minBedrooms) {
      conditions.push(`(
        SELECT SUM(pr.count) 
        FROM property_rooms pr 
        WHERE pr.property_id = p.id AND pr.room_type = 'bedroom'
      ) >= ?`);
      values.push(parseInt(minBedrooms));
    }
    
    if (minBathrooms) {
      conditions.push(`(
        SELECT SUM(pr.count) 
        FROM property_rooms pr 
        WHERE pr.property_id = p.id AND pr.room_type = 'bathroom'
      ) >= ?`);
      values.push(parseInt(minBathrooms));
    }

    if (minGuests) {
      conditions.push('p.max_guests >= ?');
      values.push(parseInt(minGuests));
    }

    if (minArea) {
      conditions.push('p.area >= ?');
      values.push(parseFloat(minArea));
    }

    // ============================================
    // 6. AMENITIES - FIXED: Check if amenities is array
    // ============================================
    const amenitiesArray = Array.isArray(amenities) ? amenities : 
                           (amenities ? [amenities] : []);
    
    const dbAmenities = mapAmenitiesToDb(amenitiesArray);
    if (dbAmenities && dbAmenities.length > 0) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM property_amenity_junction paj
          JOIN property_amenities pa ON paj.amenity_id = pa.id
          WHERE paj.property_id = p.id
            AND pa.amenity_key IN (${dbAmenities.map(() => '?').join(',')})
          GROUP BY paj.property_id
          HAVING COUNT(DISTINCT pa.amenity_key) = ?
        )
      `);
      values.push(...dbAmenities, dbAmenities.length);
    }

    // ============================================
    // 7. NEARBY ATTRACTIONS - FIXED: Check if nearbyAttractions is array
    // ============================================
    const attractionsArray = Array.isArray(nearbyAttractions) ? nearbyAttractions : 
                             (nearbyAttractions ? [nearbyAttractions] : []);
    
    if (attractionsArray.length > 0) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM property_nearby_attractions pna
          WHERE pna.property_id = p.id
            AND (
              ${attractionsArray.map(() => 'pna.attraction_name LIKE ?').join(' OR ')}
            )
        )
      `);
      attractionsArray.forEach(attraction => {
        values.push(`%${attraction}%`);
      });
    }

    // ============================================
    // 8. BOOLEAN FILTERS
    // ============================================
    if (isVerified === 'true' || isVerified === true) {
      conditions.push('p.is_verified = 1');
    }
    
    if (isFeatured === 'true' || isFeatured === true) {
      conditions.push('p.is_featured = 1');
    }
    
    if (hasImages === 'true' || hasImages === true) {
      conditions.push('EXISTS (SELECT 1 FROM property_images pi WHERE pi.property_id = p.id)');
    }
    
    if (utilitiesIncluded === 'true' || utilitiesIncluded === true) {
      conditions.push('pp.utilities_included = 1');
    }

    // Payment acceptance conditions
    if (acceptNightly === 'true' || acceptNightly === true) {
      conditions.push('pp.accept_nightly = 1');
    }
    
    if (acceptDaily === 'true' || acceptDaily === true) {
      conditions.push('pp.accept_daily = 1');
    }
    
    if (acceptWeekly === 'true' || acceptWeekly === true) {
      conditions.push('pp.accept_weekly = 1');
    }
    
    if (acceptMonthly === 'true' || acceptMonthly === true) {
      conditions.push('pp.accept_monthly = 1');
    }

    // ============================================
    // 9. BUILD MAIN QUERY
    // ============================================
    let sql = `
      SELECT 
        p.id,
        p.property_uid,
        p.title,
        p.property_type,
        p.description,
        p.address,
        p.province,
        p.district,
        p.sector,
        p.cell,
        p.village,
        p.isibo,
        p.area,
        p.max_guests,
        p.is_featured,
        p.is_verified,
        p.verification_status,
        p.created_at,
        p.published_at,
        
        pp.monthly_price,
        pp.weekly_price,
        pp.daily_price,
        pp.nightly_price,
        pp.yearly_price,
        pp.accept_monthly,
        pp.accept_weekly,
        pp.accept_daily,
        pp.accept_nightly,
        pp.accept_yearly,
        pp.utilities_included,
        pp.utilities_min,
        pp.utilities_max,
        
        (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = 1 LIMIT 1) as cover_image,
        (SELECT COUNT(*) FROM property_images pi2 WHERE pi2.property_id = p.id) as image_count,
        
        -- Room counts
        (SELECT SUM(pr.count) FROM property_rooms pr WHERE pr.property_id = p.id AND pr.room_type = 'bedroom') as bedroom_count,
        (SELECT SUM(pr.count) FROM property_rooms pr WHERE pr.property_id = p.id AND pr.room_type = 'bathroom') as bathroom_count,
        (SELECT SUM(pr.count) FROM property_rooms pr WHERE pr.property_id = p.id AND pr.room_type = 'living_room') as living_room_count,
        
        -- Amenity count
        (SELECT COUNT(*) FROM property_amenity_junction paj WHERE paj.property_id = p.id) as amenity_count,
        
        -- Nearby attraction count
        (SELECT COUNT(*) FROM property_nearby_attractions pna WHERE pna.property_id = p.id) as attraction_count
        
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
    `;

    // Add WHERE conditions
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // ============================================
    // 10. GET TOTAL COUNT
    // ============================================
    const countSql = `
      SELECT COUNT(*) as total
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
    `;
    
    const countResult = await isanzureQuery(countSql, [...values]);
    const totalCount = countResult[0]?.total || 0;

    // ============================================
    // 11. SORTING
    // ============================================
    switch(sortBy) {
      case 'price_asc':
        sql += ` ORDER BY pp.${priceColumn} ASC NULLS LAST`;
        break;
      case 'price_desc':
        sql += ` ORDER BY pp.${priceColumn} DESC NULLS LAST`;
        break;
      case 'newest':
        sql += ` ORDER BY p.created_at DESC`;
        break;
      case 'featured':
        sql += ` ORDER BY p.is_featured DESC, p.is_verified DESC, p.created_at DESC`;
        break;
      case 'verified':
        sql += ` ORDER BY p.is_verified DESC, p.created_at DESC`;
        break;
      default: // relevance - use intelligent scoring
        sql += ` ORDER BY 
          p.is_featured DESC,
          p.is_verified DESC,
          (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) DESC,
          CASE 
            WHEN p.district = ? THEN 10
            WHEN p.province = ? THEN 5
            ELSE 0
          END DESC,
          p.created_at DESC`;
        
        // Add relevance parameters
        if (parsedQuery && parsedQuery.potentialDistrict) {
          values.push(parsedQuery.potentialDistrict);
        } else {
          values.push('');
        }
        
        if (parsedQuery && parsedQuery.potentialProvince) {
          values.push(parsedQuery.potentialProvince);
        } else {
          values.push('');
        }
        break;
    }

    // Pagination
    sql += ` LIMIT ? OFFSET ?`;
    values.push(parseInt(limit), parseInt(offset));

    // Execute query
    console.log('📊 Executing enhanced search query...');
    const properties = await isanzureQuery(sql, values);

    // Calculate relevance scores and enrich data
    const enrichedProperties = await Promise.all(properties.map(async (property) => {
      // Calculate dynamic relevance score based on parsed query
      const relevanceScore = calculateEnhancedRelevance(property, parsedQuery);
      
      // Get amenities
      const amenities = await getPropertyAmenities(property.id);
      
      // Get nearby attractions
      const attractions = await getNearbyAttractions(property.id);
      
      return {
        ...property,
        relevance_score: relevanceScore,
        amenities: amenities,
        nearby_attractions: attractions,
        features: {
          has_images: property.image_count > 0,
          is_verified: property.is_verified,
          is_featured: property.is_featured,
          utilities_included: property.utilities_included
        }
      };
    }));

    // Sort by relevance score if that's the sort method
    if (sortBy === 'relevance') {
      enrichedProperties.sort((a, b) => b.relevance_score - a.relevance_score);
    }

    // Generate intelligent recommendations
    const recommendations = await generateEnhancedRecommendations({
      province: province || (parsedQuery ? parsedQuery.potentialProvince : null),
      district: district || (parsedQuery ? parsedQuery.potentialDistrict : null),
      sector: sector || (parsedQuery ? parsedQuery.potentialSector : null),
      cell,
      village,
      isibo: isibo || (parsedQuery ? parsedQuery.potentialIsibo : null),
      propertyTypes: dbPropertyTypes,
      priceRange: { min: minPrice, max: maxPrice, period: pricePeriod },
      amenities: dbAmenities,
      parsedQuery
    });

    // Prepare response
    const response = {
      success: true,
      data: enrichedProperties,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + enrichedProperties.length) < totalCount
      },
      filters: {
        query,
        parsed: parsedQuery,
        location: { province, district, sector, cell, village, isibo },
        price: { min: minPrice, max: maxPrice, period: pricePeriod },
        requirements: { 
          minBedrooms, 
          minBathrooms, 
          minGuests, 
          minArea 
        },
        propertyTypes: propertyTypesArray,
        amenities: amenitiesArray,
        nearbyAttractions: attractionsArray,
        flags: { 
          isVerified, 
          isFeatured, 
          hasImages, 
          utilitiesIncluded,
          acceptNightly,
          acceptDaily,
          acceptWeekly,
          acceptMonthly
        }
      },
      recommendations,
      statistics: await getEnhancedStatistics(properties, province, district),
      meta: {
        searchId: generateSearchId(),
        timestamp: new Date().toISOString(),
        queryConfidence: parsedQuery ? parsedQuery.confidence : 0
      }
    };

    console.log(`✅ Enhanced search completed: ${enrichedProperties.length} properties found`);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error in advancedSearch:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Calculate enhanced relevance score
 */
function calculateEnhancedRelevance(property, parsedQuery) {
  let score = 100; // Base score

  if (!parsedQuery || !property) return score;

  const title = property.title?.toLowerCase() || '';
  const description = property.description?.toLowerCase() || '';
  const address = property.address?.toLowerCase() || '';
  const propertyType = property.property_type?.toLowerCase() || '';
  const district = property.district?.toLowerCase() || '';
  const sector = property.sector?.toLowerCase() || '';
  const cell = property.cell?.toLowerCase() || '';
  const village = property.village?.toLowerCase() || '';
  const isibo = property.isibo?.toLowerCase() || '';

  // Exact district match (highest priority)
  if (parsedQuery.potentialDistrict && district === parsedQuery.potentialDistrict.toLowerCase()) {
    score += 500;
  }

  // Exact province match
  if (parsedQuery.potentialProvince && property.province === parsedQuery.potentialProvince) {
    score += 300;
  }

  // Sector match
  if (parsedQuery.potentialSector && sector.includes(parsedQuery.potentialSector.toLowerCase())) {
    score += 200;
  }

  // Cell match
  if (parsedQuery.potentialCell && cell.includes(parsedQuery.potentialCell.toLowerCase())) {
    score += 150;
  }

  // Village match
  if (parsedQuery.potentialVillage && village.includes(parsedQuery.potentialVillage.toLowerCase())) {
    score += 100;
  }

  // Isibo match
  if (parsedQuery.potentialIsibo && isibo.includes(parsedQuery.potentialIsibo.toLowerCase())) {
    score += 250;
  }

  // Property type match
  parsedQuery.propertyTerms.forEach(term => {
    if (propertyType.includes(term)) {
      score += 100;
    }
  });

  // Title/description matches
  parsedQuery.words.forEach(word => {
    if (word.length > 2) {
      if (title.includes(word)) score += 50;
      if (description.includes(word)) score += 30;
      if (address.includes(word)) score += 20;
    }
  });

  // Boost for featured/verified
  if (property.is_featured) score += 150;
  if (property.is_verified) score += 100;

  // Boost for having images
  if (property.image_count > 0) score += 50;
  if (property.image_count >= 3) score += 30;

  return score;
}

/**
 * Generate enhanced recommendations
 */
async function generateEnhancedRecommendations(context) {
  const recommendations = {
    similarProperties: [],
    nearbyLocations: [],
    popularInArea: [],
    priceAlternatives: []
  };

  try {
    // Similar properties in same district/sector
    if (context.district || context.sector) {
      const similarSql = `
        SELECT 
          p.id,
          p.property_uid,
          p.title,
          p.property_type,
          p.district,
          p.sector,
          pp.monthly_price,
          (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as cover_image,
          'similar' as recommendation_type
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.status = 'active'
          ${context.district ? 'AND p.district = ?' : ''}
          ${context.sector ? 'AND p.sector = ?' : ''}
          ${context.propertyTypes?.length > 0 ? `AND p.property_type IN (${context.propertyTypes.map(() => '?').join(',')})` : ''}
        ORDER BY p.is_featured DESC, p.is_verified DESC, RAND()
        LIMIT 6
      `;

      const similarValues = [];
      if (context.district) similarValues.push(context.district);
      if (context.sector) similarValues.push(context.sector);
      if (context.propertyTypes?.length > 0) similarValues.push(...context.propertyTypes);

      recommendations.similarProperties = await isanzureQuery(similarSql, similarValues);
    }

    // Nearby locations (other sectors in same district)
    if (context.district) {
      const nearbySql = `
        SELECT 
          sector as name,
          CONCAT(sector, ', ', district) as fullName,
          'sector' as type,
          '📍' as icon,
          COUNT(*) as property_count
        FROM properties
        WHERE status = 'active' AND district = ?
        GROUP BY sector
        ORDER BY property_count DESC
        LIMIT 5
      `;

      recommendations.nearbyLocations = await isanzureQuery(nearbySql, [context.district]);
    }

    // Popular in area
    const popularSql = `
      SELECT 
        p.property_type as name,
        CONCAT(UPPER(SUBSTRING(p.property_type, 1, 1)), SUBSTRING(p.property_type, 2)) as fullName,
        'property_type' as type,
        '🔥' as icon,
        COUNT(*) as count
      FROM properties p
      WHERE p.status = 'active'
        ${context.province ? 'AND p.province = ?' : ''}
        ${context.district ? 'AND p.district = ?' : ''}
      GROUP BY p.property_type
      ORDER BY count DESC
      LIMIT 4
    `;

    const popularValues = [];
    if (context.province) popularValues.push(context.province);
    if (context.district) popularValues.push(context.district);

    recommendations.popularInArea = await isanzureQuery(popularSql, popularValues);

  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
  }

  return recommendations;
}

/**
 * Get enhanced statistics
 */
async function getEnhancedStatistics(properties, province, district) {
  try {
    const stats = {
      priceRange: await getPriceRangeStats(province, district),
      popularLocations: await getPopularLocations(properties),
      averagePrice: await getAveragePrice(province, district, 'monthly'),
      totalAvailable: properties.length,
      byPropertyType: {}
    };

    // Count by property type
    properties.forEach(p => {
      const type = p.property_type || 'other';
      stats.byPropertyType[type] = (stats.byPropertyType[type] || 0) + 1;
    });

    return stats;
  } catch (error) {
    return {
      priceRange: { min: 0, max: 0, avg: 0 },
      popularLocations: [],
      averagePrice: 0,
      totalAvailable: 0,
      byPropertyType: {}
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapProvinceToDb(province) {
  const provinceMap = {
    'Northern': 'North',
    'Southern': 'South',
    'Eastern': 'East',
    'Western': 'West',
    'Kigali': 'Kigali',
    'North': 'North',
    'South': 'South',
    'East': 'East',
    'West': 'West'
  };
  return provinceMap[province] || province;
}

function mapPropertyTypesToDb(types) {
  const typeMap = {
    'apartment': 'apartment',
    'house': 'house',
    'villa': 'villa',
    'condo': 'condo',
    'studio': 'studio',
    'penthouse': 'penthouse',
    'townhouse': 'townhouse',
    'ghetto': 'ghetto',
    'living_house': 'living_house',
    'upmarket': 'upmarket',
    'service_apartment': 'service_apartment',
    'guest_house': 'guest_house',
    'bungalow': 'bungalow',
    'commercial': 'commercial',
    'hostel': 'hostel'
  };

  return types.map(t => typeMap[t] || t).filter(t => t);
}

function mapAmenitiesToDb(amenities) {
  const amenityMap = {
    'electricity_24_7': 'electricity_24_7',
    'running_water': 'running_water',
    'wifi': 'wifi',
    'borehole': 'borehole',
    'solar_power': 'solar_power',
    'generator': 'generator_backup',
    'compound_security': 'compound_security',
    'watchman': 'watchman',
    'cctv': 'cctv',
    'alarm': 'alarm',
    'gate': 'gate',
    'air_conditioning': 'air_conditioning',
    'ceiling_fans': 'ceiling_fans',
    'heating': 'heating',
    'fireplace': 'fireplace',
    'tv': 'television',
    'fridge': 'fridge',
    'oven': 'oven',
    'microwave': 'microwave',
    'dishwasher': 'dishwasher',
    'kitchen_utensils': 'kitchen_utensils',
    'parking': 'parking',
    'garden': 'garden',
    'balcony': 'balcony',
    'swimming_pool': 'swimming_pool',
    'bbq_area': 'bbq_area',
    'gym': 'gym',
    'laundry': 'washing_machine',
    'cleaning': 'cleaning_service',
    'business_center': 'workspace',
    'conference_room': 'conference_room'
  };

  return amenities.map(a => amenityMap[a] || a).filter(a => a);
}

async function getPropertyAmenities(propertyId) {
  try {
    const sql = `
      SELECT pa.amenity_key, pa.amenity_name, pa.category
      FROM property_amenity_junction paj
      JOIN property_amenities pa ON paj.amenity_id = pa.id
      WHERE paj.property_id = ?
    `;
    return await isanzureQuery(sql, [propertyId]);
  } catch (error) {
    return [];
  }
}

async function getNearbyAttractions(propertyId) {
  try {
    const sql = `SELECT attraction_name, attraction_type, distance_km FROM property_nearby_attractions WHERE property_id = ?`;
    return await isanzureQuery(sql, [propertyId]);
  } catch (error) {
    return [];
  }
}

async function getPriceRangeStats(province, district) {
  try {
    const sql = `
      SELECT 
        MIN(pp.monthly_price) as min,
        MAX(pp.monthly_price) as max,
        AVG(pp.monthly_price) as avg,
        COUNT(*) as count
      FROM property_pricing pp
      JOIN properties p ON pp.property_id = p.id
      WHERE p.status = 'active'
        AND pp.monthly_price > 0
        ${province ? 'AND p.province = ?' : ''}
        ${district ? 'AND p.district = ?' : ''}
    `;

    const values = [];
    if (province) values.push(province);
    if (district) values.push(district);

    const result = await isanzureQuery(sql, values);
    return {
      min: Math.round(result[0]?.min || 0),
      max: Math.round(result[0]?.max || 500000),
      avg: Math.round(result[0]?.avg || 150000),
      count: result[0]?.count || 0
    };
  } catch (error) {
    return { min: 0, max: 500000, avg: 150000, count: 0 };
  }
}

async function getPopularLocations(properties) {
  const locationCounts = {};
  properties.forEach(p => {
    if (p.district && p.province) {
      const key = `${p.district}, ${p.province}`;
      locationCounts[key] = (locationCounts[key] || 0) + 1;
    }
  });

  return Object.entries(locationCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

async function getAveragePrice(province, district, period = 'monthly') {
  try {
    const priceColumn = `${period}_price`;
    const sql = `
      SELECT AVG(pp.${priceColumn}) as avg_price
      FROM property_pricing pp
      JOIN properties p ON pp.property_id = p.id
      WHERE p.status = 'active'
        AND pp.${priceColumn} > 0
        ${province ? 'AND p.province = ?' : ''}
        ${district ? 'AND p.district = ?' : ''}
    `;

    const values = [];
    if (province) values.push(province);
    if (district) values.push(district);

    const result = await isanzureQuery(sql, values);
    return Math.round(result[0]?.avg_price || 0);
  } catch (error) {
    return 0;
  }
}

function generateSearchId() {
  return 'search_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 3. GET POPULAR SEARCHES AND RECOMMENDATIONS
exports.getPopularSearches = async (req, res) => {
  try {
    const { userProvince, userDistrict, limit = 10 } = req.query;

    const recommendations = {
      popularDestinations: [],
      trendingSearches: [],
      nearbySuggestions: [],
      personalized: []
    };

    // Get popular destinations based on property counts
    const destinationsSql = `
      SELECT 
        CONCAT(p.district, ', ', p.province) as name,
        CONCAT(p.district, ', ', p.province) as fullName,
        'destination' as type,
        CASE 
          WHEN p.province = 'Kigali' THEN '🏙️'
          WHEN p.district LIKE '%musanze%' THEN '🌋'
          WHEN p.district LIKE '%rubavu%' THEN '🏖️'
          WHEN p.district LIKE '%huye%' THEN '🏛️'
          ELSE '📍'
        END as icon,
        'Popular area for rentals' as description,
        COUNT(*) as propertyCount,
        ROUND(AVG(pp.monthly_price)) as avgPrice
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
      GROUP BY p.province, p.district
      ORDER BY propertyCount DESC
      LIMIT 8
    `;

    recommendations.popularDestinations = await isanzureQuery(destinationsSql);

    // Get trending searches (based on recently added properties)
    const trendingSql = `
      SELECT DISTINCT
        p.district as name,
        CONCAT(p.district, ', ', p.province) as fullName,
        'trending' as type,
        '🔥' as icon,
        'Trending location' as description,
        COUNT(*) as recentCount
      FROM properties p
      WHERE p.status = 'active'
        AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY p.province, p.district
      ORDER BY recentCount DESC
      LIMIT 5
    `;

    recommendations.trendingSearches = await isanzureQuery(trendingSql);

    // Get nearby suggestions if user location is provided
    if (userProvince) {
      const nearbySql = `
        SELECT DISTINCT
          p.district as name,
          CONCAT(p.district, ', ', p.province) as fullName,
          'nearby' as type,
          '📍' as icon,
          'Near your location' as description,
          COUNT(*) as propertyCount
        FROM properties p
        WHERE p.status = 'active'
          AND p.province = ?
          ${userDistrict ? 'AND p.district != ?' : ''}
        GROUP BY p.district
        ORDER BY propertyCount DESC
        LIMIT 5
      `;

      const nearbyValues = [mapProvinceToDb(userProvince)];
      if (userDistrict) nearbyValues.push(userDistrict);

      recommendations.nearbySuggestions = await isanzureQuery(nearbySql, nearbyValues);
    }

    // Get personalized recommendations based on property types distribution
    const personalizedSql = `
      SELECT 
        p.property_type as name,
        CONCAT(UPPER(SUBSTRING(p.property_type, 1, 1)), SUBSTRING(p.property_type, 2), ' (', COUNT(*), ' available)') as fullName,
        'personalized' as type,
        '💎' as icon,
        'Based on availability' as description,
        COUNT(*) as count,
        ROUND(AVG(pp.monthly_price)) as avgPrice
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
        ${userProvince ? 'AND p.province = ?' : ''}
      GROUP BY p.property_type
      ORDER BY count DESC
      LIMIT 5
    `;

    const personalizedValues = userProvince ? [mapProvinceToDb(userProvince)] : [];
    recommendations.personalized = await isanzureQuery(personalizedSql, personalizedValues);

    res.status(200).json({
      success: true,
      recommendations,
      locationContext: {
        userProvince,
        userDistrict,
        hasLocation: !!(userProvince || userDistrict)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in getPopularSearches:', error);
    res.status(200).json({
      success: true,
      recommendations: {
        popularDestinations: [],
        trendingSearches: [],
        nearbySuggestions: [],
        personalized: []
      }
    });
  }
};

// 4. GET SEARCH AUTOCOMPLETE (for search bar)
exports.getAutocomplete = async (req, res) => {
  try {
    const { q = '', limit = 8 } = req.query;

    if (!q.trim() || q.length < 2) {
      return res.status(200).json({
        success: true,
        results: []
      });
    }

    const searchTerm = `%${q}%`;

    // Get location autocomplete
    const locationSql = `
      SELECT 
        name,
        fullName,
        type,
        icon,
        description,
        'location' as category
      FROM (
        SELECT 
          province as name,
          province as fullName,
          'province' as type,
          '🗺️' as icon,
          'Province' as description
        FROM properties
        WHERE status = 'active' AND province LIKE ?
        
        UNION
        
        SELECT 
          district as name,
          CONCAT(district, ', ', province) as fullName,
          'district' as type,
          '🏙️' as icon,
          'District' as description
        FROM properties
        WHERE status = 'active' AND district LIKE ?
        
        UNION
        
        SELECT 
          sector as name,
          CONCAT(sector, ', ', district) as fullName,
          'sector' as type,
          '📍' as icon,
          'Sector' as description
        FROM properties
        WHERE status = 'active' AND sector LIKE ?
      ) as locations
      ORDER BY 
        CASE 
          WHEN name LIKE CONCAT(?, '%') THEN 1
          ELSE 2
        END,
        name
      LIMIT ?
    `;

    const locations = await isanzureQuery(locationSql, [searchTerm, searchTerm, searchTerm, q, parseInt(limit)]);

    // Get property type autocomplete
    const typeSql = `
      SELECT 
        property_type as name,
        CONCAT(UPPER(SUBSTRING(property_type, 1, 1)), SUBSTRING(property_type, 2)) as fullName,
        'property_type' as type,
        '🏠' as icon,
        'Property Type' as description,
        'type' as category
      FROM properties
      WHERE status = 'active' AND property_type LIKE ?
      GROUP BY property_type
      ORDER BY 
        CASE 
          WHEN property_type LIKE CONCAT(?, '%') THEN 1
          ELSE 2
        END
      LIMIT 3
    `;

    const types = await isanzureQuery(typeSql, [searchTerm, q]);

    // Combine results
    const results = [...locations, ...types];

    res.status(200).json({
      success: true,
      query: q,
      results: results.slice(0, limit),
      categories: [...new Set(results.map(r => r.category))],
      hasMore: results.length >= limit
    });

  } catch (error) {
    console.error('❌ Error in getAutocomplete:', error);
    res.status(200).json({
      success: true,
      results: []
    });
  }
};

// 5. GET SEARCH FILTERS ENHANCED
exports.getSearchFilters = async (req, res) => {
  try {
    const { province, district, propertyType } = req.query;

    // Get price statistics
    const priceStats = await getPriceRangeStats(province, district);

    // Get property types with counts
    const typesSql = `
      SELECT 
        property_type as value,
        CONCAT(UPPER(SUBSTRING(property_type, 1, 1)), SUBSTRING(property_type, 2)) as label,
        COUNT(*) as count,
        ROUND(AVG(pp.monthly_price)) as avgPrice
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
        ${province ? 'AND p.province = ?' : ''}
        ${district ? 'AND p.district = ?' : ''}
      GROUP BY property_type
      ORDER BY count DESC
    `;

    const typeValues = [];
    if (province) typeValues.push(mapProvinceToDb(province));
    if (district) typeValues.push(district);

    const propertyTypes = await isanzureQuery(typesSql, typeValues);

    // Get amenities by category
    const amenitiesSql = `
      SELECT 
        pa.amenity_key as value,
        pa.amenity_name as label,
        pa.category,
        COUNT(paj.id) as count,
        ROUND(COUNT(paj.id) * 100.0 / (SELECT COUNT(*) FROM properties WHERE status = 'active'), 1) as percentage
      FROM property_amenities pa
      LEFT JOIN property_amenity_junction paj ON pa.id = paj.amenity_id
      LEFT JOIN properties p ON paj.property_id = p.id AND p.status = 'active'
      GROUP BY pa.id, pa.category, pa.amenity_name
      ORDER BY pa.category, count DESC
    `;

    const amenities = await isanzureQuery(amenitiesSql);

    // Get nearby attraction types
    const attractionsSql = `
      SELECT 
        DISTINCT attraction_type as value,
        CONCAT(UPPER(SUBSTRING(attraction_type, 1, 1)), SUBSTRING(attraction_type, 2)) as label,
        COUNT(*) as count
      FROM property_nearby_attractions pna
      JOIN properties p ON pna.property_id = p.id AND p.status = 'active'
      GROUP BY attraction_type
      ORDER BY count DESC
    `;

    const attractions = await isanzureQuery(attractionsSql);

    // Get location hierarchy
    const locations = await getLocationHierarchy(province, district);

    res.status(200).json({
      success: true,
      filters: {
        priceRange: {
          min: priceStats.min,
          max: priceStats.max,
          average: priceStats.avg,
          suggestedMin: Math.round(priceStats.min * 1.1),
          suggestedMax: Math.round(priceStats.max * 0.9)
        },
        propertyTypes: propertyTypes.map(t => ({
          ...t,
          popular: t.count > 10,
          priceRange: {
            min: Math.round(t.avgPrice * 0.7),
            max: Math.round(t.avgPrice * 1.3)
          }
        })),
        amenities: amenities.reduce((acc, amenity) => {
          if (!acc[amenity.category]) {
            acc[amenity.category] = [];
          }
          acc[amenity.category].push({
            ...amenity,
            common: amenity.percentage > 20
          });
          return acc;
        }, {}),
        nearbyAttractions: attractions,
        locations,
        roomOptions: {
          bedrooms: [
            { value: '', label: 'Any' },
            { value: '1', label: '1+' },
            { value: '2', label: '2+' },
            { value: '3', label: '3+' },
            { value: '4', label: '4+' },
            { value: '5', label: '5+' }
          ],
          bathrooms: [
            { value: '', label: 'Any' },
            { value: '1', label: '1+' },
            { value: '2', label: '2+' },
            { value: '3', label: '3+' },
            { value: '4', label: '4+' }
          ],
          guests: [
            { value: '1', label: '1+' },
            { value: '2', label: '2+' },
            { value: '3', label: '3+' },
            { value: '4', label: '4+' },
            { value: '5', label: '5+' },
            { value: '6', label: '6+' },
            { value: '8', label: '8+' },
            { value: '10', label: '10+' }
          ]
        },
        pricePeriods: [
          { value: 'monthly', label: 'Monthly' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'daily', label: 'Daily' },
          { value: 'nightly', label: 'Nightly' }
        ],
        sortOptions: [
          { value: 'relevance', label: 'Most Relevant' },
          { value: 'price_asc', label: 'Price: Low to High' },
          { value: 'price_desc', label: 'Price: High to Low' },
          { value: 'newest', label: 'Newest First' },
          { value: 'featured', label: 'Featured' },
          { value: 'verified', label: 'Verified Only' }
        ]
      },
      statistics: {
        totalProperties: await getTotalProperties(province, district),
        averagePrice: priceStats.avg,
        popularType: propertyTypes[0] || null,
        commonAmenities: amenities.filter(a => a.percentage > 30).slice(0, 5)
      }
    });

  } catch (error) {
    console.error('❌ Error in getSearchFilters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load filters'
    });
  }
};

// HELPER FUNCTIONS

// Generate intelligent recommendations
async function generateIntelligentRecommendations(context) {
  const recommendations = {
    similarProperties: [],
    popularNearby: [],
    trending: [],
    priceAlternatives: [],
    typeAlternatives: []
  };

  try {
    // Similar properties based on context
    if (context.province || context.district || context.propertyTypes?.length > 0) {
      const similarSql = `
        SELECT 
          p.id,
          p.property_uid,
          p.title,
          p.property_type,
          p.district,
          p.sector,
          pp.monthly_price,
          (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as cover_image,
          'similar' as recommendation_type,
          COUNT(*) OVER() as total_similar
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.status = 'active'
          ${context.province ? 'AND p.province = ?' : ''}
          ${context.district ? 'AND p.district = ?' : ''}
          ${context.propertyTypes?.length > 0 ? `AND p.property_type IN (${context.propertyTypes.map(() => '?').join(',')})` : ''}
        ORDER BY p.is_featured DESC, p.is_verified DESC, RAND()
        LIMIT 6
      `;

      const similarValues = [];
      if (context.province) similarValues.push(mapProvinceToDb(context.province));
      if (context.district) similarValues.push(context.district);
      if (context.propertyTypes?.length > 0) similarValues.push(...context.propertyTypes);

      recommendations.similarProperties = await isanzureQuery(similarSql, similarValues);
    }

    // Popular nearby properties
    if (context.province) {
      const popularSql = `
        SELECT 
          p.id,
          p.property_uid,
          p.title,
          p.property_type,
          p.district,
          p.sector,
          pp.monthly_price,
          (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as cover_image,
          'popular_nearby' as recommendation_type,
          (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) as image_count
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.status = 'active'
          AND p.province = ?
          AND p.is_featured = 1
        ORDER BY p.is_verified DESC, p.created_at DESC
        LIMIT 4
      `;

      recommendations.popularNearby = await isanzureQuery(popularSql, [mapProvinceToDb(context.province)]);
    }

    // Trending properties (recently added)
    const trendingSql = `
      SELECT 
        p.id,
        p.property_uid,
        p.title,
        p.property_type,
        p.district,
        p.sector,
        pp.monthly_price,
        (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as cover_image,
        'trending' as recommendation_type,
        DATEDIFF(NOW(), p.created_at) as days_ago
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
        AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY p.created_at DESC
      LIMIT 4
    `;

    recommendations.trending = await isanzureQuery(trendingSql);

    // Price alternatives (similar price range)
    if (context.priceRange?.min || context.priceRange?.max) {
      const avgPrice = ((parseInt(context.priceRange.min) || 0) + (parseInt(context.priceRange.max) || 500000)) / 2;
      const priceMargin = avgPrice * 0.3;

      const priceSql = `
        SELECT 
          p.id,
          p.property_uid,
          p.title,
          p.property_type,
          p.district,
          p.sector,
          pp.monthly_price,
          (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as cover_image,
          'price_alternative' as recommendation_type,
          ABS(pp.monthly_price - ?) as price_difference
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.status = 'active'
          AND pp.monthly_price BETWEEN ? AND ?
          AND pp.monthly_price IS NOT NULL
        ORDER BY price_difference ASC
        LIMIT 4
      `;

      recommendations.priceAlternatives = await isanzureQuery(priceSql, [
        avgPrice,
        avgPrice - priceMargin,
        avgPrice + priceMargin
      ]);
    }

  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
  }

  return recommendations;
}

// Get price range statistics
async function getPriceRangeStats(province, district) {
  try {
    const sql = `
      SELECT 
        MIN(pp.monthly_price) as min,
        MAX(pp.monthly_price) as max,
        AVG(pp.monthly_price) as avg,
        STDDEV(pp.monthly_price) as stddev,
        COUNT(*) as count
      FROM property_pricing pp
      JOIN properties p ON pp.property_id = p.id
      WHERE p.status = 'active'
        AND pp.monthly_price > 0
        ${province ? 'AND p.province = ?' : ''}
        ${district ? 'AND p.district = ?' : ''}
    `;

    const values = [];
    if (province) values.push(mapProvinceToDb(province));
    if (district) values.push(district);

    const result = await isanzureQuery(sql, values);
    const stats = result[0] || { min: 0, max: 500000, avg: 150000, stddev: 100000, count: 0 };

    // Calculate quartiles if we have enough data
    if (stats.count > 10) {
      const quartileSql = `
        SELECT 
          MIN(monthly_price) as q0,
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY monthly_price) as q1,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY monthly_price) as q2,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY monthly_price) as q3,
          MAX(monthly_price) as q4
        FROM (
          SELECT pp.monthly_price
          FROM property_pricing pp
          JOIN properties p ON pp.property_id = p.id
          WHERE p.status = 'active'
            AND pp.monthly_price > 0
            ${province ? 'AND p.province = ?' : ''}
            ${district ? 'AND p.district = ?' : ''}
          ORDER BY pp.monthly_price
        ) as prices
      `;

      const quartiles = await isanzureQuery(quartileSql, values);
      if (quartiles[0]) {
        stats.quartiles = quartiles[0];
      }
    }

    return {
      min: Math.round(stats.min || 0),
      max: Math.round(stats.max || 500000),
      avg: Math.round(stats.avg || 150000),
      stddev: Math.round(stats.stddev || 100000),
      count: stats.count
    };

  } catch (error) {
    console.error('❌ Error getting price range stats:', error);
    return { min: 0, max: 500000, avg: 150000, stddev: 100000, count: 0 };
  }
}

// Get popular locations from properties
async function getPopularLocations(properties) {
  try {
    if (!properties || properties.length === 0) {
      // Get default popular locations
      const sql = `
        SELECT 
          CONCAT(p.district, ', ', p.province) as name,
          COUNT(*) as count,
          ROUND(AVG(pp.monthly_price)) as avgPrice
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.status = 'active'
        GROUP BY p.province, p.district
        ORDER BY count DESC
        LIMIT 5
      `;

      return await isanzureQuery(sql);
    }

    const locationCounts = {};
    properties.forEach(property => {
      const key = `${property.district}, ${property.province}`;
      if (property.district && property.province) {
        locationCounts[key] = (locationCounts[key] || 0) + 1;
      }
    });

    return Object.entries(locationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

  } catch (error) {
    return [];
  }
}

// Get average price
async function getAveragePrice(province, district, period = 'monthly') {
  try {
    const priceColumn = `${period}_price`;
    const sql = `
      SELECT 
        AVG(pp.${priceColumn}) as avg_price,
        COUNT(*) as count
      FROM property_pricing pp
      JOIN properties p ON pp.property_id = p.id
      WHERE p.status = 'active'
        AND pp.${priceColumn} > 0
        ${province ? 'AND p.province = ?' : ''}
        ${district ? 'AND p.district = ?' : ''}
    `;

    const values = [];
    if (province) values.push(mapProvinceToDb(province));
    if (district) values.push(district);

    const result = await isanzureQuery(sql, values);
    return {
      average: Math.round(result[0]?.avg_price || 0),
      count: result[0]?.count || 0,
      period: period
    };

  } catch (error) {
    return { average: 0, count: 0, period: period };
  }
}

// Get location hierarchy
async function getLocationHierarchy(province, district) {
  try {
    const locations = {};

    // Get provinces
    const provincesSql = `
      SELECT DISTINCT province
      FROM properties
      WHERE status = 'active' AND province IS NOT NULL
      ORDER BY province
    `;
    const provinces = await isanzureQuery(provincesSql);
    locations.provinces = provinces.map(p => p.province);

    // Get districts for selected province
    if (province) {
      const districtsSql = `
        SELECT DISTINCT district
        FROM properties
        WHERE status = 'active' 
          AND province = ? 
          AND district IS NOT NULL
        ORDER BY district
      `;
      const districts = await isanzureQuery(districtsSql, [mapProvinceToDb(province)]);
      locations.districts = districts.map(d => d.district);
    }

    // Get sectors for selected district
    if (district) {
      const sectorsSql = `
        SELECT DISTINCT sector
        FROM properties
        WHERE status = 'active' 
          AND province = ? 
          AND district = ? 
          AND sector IS NOT NULL
        ORDER BY sector
      `;
      const sectors = await isanzureQuery(sectorsSql, [mapProvinceToDb(province), district]);
      locations.sectors = sectors.map(s => s.sector);
    }

    // Get cells for selected sector (if needed)
    if (district) {
      const cellsSql = `
        SELECT DISTINCT cell
        FROM properties
        WHERE status = 'active' 
          AND province = ? 
          AND district = ? 
          AND cell IS NOT NULL
        ORDER BY cell
      `;
      const cells = await isanzureQuery(cellsSql, [mapProvinceToDb(province), district]);
      locations.cells = cells.map(c => c.cell);
    }

    return locations;

  } catch (error) {
    console.error('❌ Error getting location hierarchy:', error);
    return { provinces: [], districts: [], sectors: [], cells: [] };
  }
}

// Get total properties
async function getTotalProperties(province, district) {
  try {
    const sql = `
      SELECT COUNT(*) as total
      FROM properties
      WHERE status = 'active'
        ${province ? 'AND province = ?' : ''}
        ${district ? 'AND district = ?' : ''}
    `;

    const values = [];
    if (province) values.push(mapProvinceToDb(province));
    if (district) values.push(district);

    const result = await isanzureQuery(sql, values);
    return result[0]?.total || 0;

  } catch (error) {
    return 0;
  }
}

// Get similar search terms
async function getSimilarSearchTerms(query) {
  try {
    if (query.length < 3) return [];

    const searchTerm = `%${query}%`;

    const sql = `
      SELECT 
        term,
        type,
        frequency
      FROM (
        -- District terms
        SELECT 
          district as term,
          'district' as type,
          COUNT(*) as frequency
        FROM properties
        WHERE status = 'active' AND district LIKE ?
        GROUP BY district
        
        UNION
        
        -- Property type terms
        SELECT 
          property_type as term,
          'type' as type,
          COUNT(*) as frequency
        FROM properties
        WHERE status = 'active' AND property_type LIKE ?
        GROUP BY property_type
        
        UNION
        
        -- Sector terms
        SELECT 
          sector as term,
          'sector' as type,
          COUNT(*) as frequency
        FROM properties
        WHERE status = 'active' AND sector LIKE ?
        GROUP BY sector
      ) as terms
      ORDER BY 
        CASE 
          WHEN term LIKE CONCAT(?, '%') THEN 1
          ELSE 2
        END,
        frequency DESC
      LIMIT 5
    `;

    return await isanzureQuery(sql, [searchTerm, searchTerm, searchTerm, query]);

  } catch (error) {
    return [];
  }
}

// Analyze search pattern
function analyzeSearchPattern(query) {
  const patterns = {
    type: 'general',
    confidence: 0.5
  };

  if (!query) return patterns;

  const queryLower = query.toLowerCase();

  // Check for location patterns
  const locationIndicators = ['kigali', 'musanze', 'rubavu', 'huye', 'district', 'sector', 'province'];
  if (locationIndicators.some(indicator => queryLower.includes(indicator))) {
    patterns.type = 'location';
    patterns.confidence = 0.8;
  }

  // Check for property type patterns
  const typeIndicators = ['apartment', 'house', 'villa', 'ghetto', 'hostel', 'studio'];
  if (typeIndicators.some(indicator => queryLower.includes(indicator))) {
    patterns.type = 'property_type';
    patterns.confidence = 0.9;
  }

  // Check for price patterns
  const priceIndicators = ['rwf', 'frw', 'price', 'cheap', 'expensive', 'rent'];
  if (priceIndicators.some(indicator => queryLower.includes(indicator))) {
    patterns.type = 'price';
    patterns.confidence = 0.7;
  }

  // Check for landmark patterns
  const landmarkIndicators = ['near', 'close to', 'hafi', 'university', 'hospital', 'market'];
  if (landmarkIndicators.some(indicator => queryLower.includes(indicator))) {
    patterns.type = 'landmark';
    patterns.confidence = 0.85;
  }

  return patterns;
}

// Generate unique search ID
function generateSearchId() {
  return 'search_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 6. SEARCH INSIGHTS AND ANALYTICS
exports.getSearchInsights = async (req, res) => {
  try {
    const { province, district, timeframe = 'month' } = req.query;

    // Get search trends
    const trendsSql = `
      SELECT 
        DATE(p.created_at) as date,
        COUNT(*) as new_properties,
        AVG(pp.monthly_price) as avg_price
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
        AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ${province ? 'AND p.province = ?' : ''}
        ${district ? 'AND p.district = ?' : ''}
      GROUP BY DATE(p.created_at)
      ORDER BY date DESC
    `;

    const trendValues = [];
    if (province) trendValues.push(mapProvinceToDb(province));
    if (district) trendValues.push(district);

    const trends = await isanzureQuery(trendsSql, trendValues);

    // Get price distribution
    const priceDistSql = `
      SELECT 
        CASE
          WHEN pp.monthly_price < 50000 THEN 'Under 50k'
          WHEN pp.monthly_price < 100000 THEN '50k - 100k'
          WHEN pp.monthly_price < 200000 THEN '100k - 200k'
          WHEN pp.monthly_price < 300000 THEN '200k - 300k'
          WHEN pp.monthly_price < 500000 THEN '300k - 500k'
          WHEN pp.monthly_price < 1000000 THEN '500k - 1M'
          ELSE 'Over 1M'
        END as price_range,
        COUNT(*) as property_count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM properties WHERE status = 'active'), 1) as percentage
      FROM property_pricing pp
      JOIN properties p ON pp.property_id = p.id
      WHERE p.status = 'active'
        AND pp.monthly_price > 0
        ${province ? 'AND p.province = ?' : ''}
        ${district ? 'AND p.district = ?' : ''}
      GROUP BY price_range
      ORDER BY MIN(pp.monthly_price)
    `;

    const priceDistribution = await isanzureQuery(priceDistSql, trendValues);

    // Get popular amenities
    const popularAmenitiesSql = `
      SELECT 
        pa.amenity_name,
        pa.category,
        COUNT(paj.id) as count,
        ROUND(COUNT(paj.id) * 100.0 / (SELECT COUNT(*) FROM properties WHERE status = 'active'), 1) as percentage
      FROM property_amenities pa
      JOIN property_amenity_junction paj ON pa.id = paj.amenity_id
      JOIN properties p ON paj.property_id = p.id AND p.status = 'active'
      ${province ? 'AND p.province = ?' : ''}
      ${district ? 'AND p.district = ?' : ''}
      GROUP BY pa.id, pa.amenity_name, pa.category
      ORDER BY count DESC
      LIMIT 10
    `;

    const popularAmenities = await isanzureQuery(popularAmenitiesSql, trendValues);

    // Get verification statistics
    const verificationSql = `
      SELECT 
        verification_status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM properties WHERE status = 'active'), 1) as percentage
      FROM properties
      WHERE status = 'active'
        ${province ? 'AND province = ?' : ''}
        ${district ? 'AND district = ?' : ''}
      GROUP BY verification_status
    `;

    const verificationStats = await isanzureQuery(verificationSql, trendValues);

    res.status(200).json({
      success: true,
      insights: {
        trends: {
          daily: trends,
          totalProperties: trends.reduce((sum, day) => sum + day.new_properties, 0),
          averageDailyNew: Math.round(trends.reduce((sum, day) => sum + day.new_properties, 0) / Math.max(trends.length, 1))
        },
        priceDistribution,
        popularAmenities: popularAmenities.map(amenity => ({
          ...amenity,
          common: amenity.percentage > 30,
          veryCommon: amenity.percentage > 50
        })),
        verification: verificationStats,
        marketHealth: {
          inventoryLevel: trends.length > 0 ? 'good' : 'low',
          priceStability: calculatePriceStability(trends),
          demandIndicator: await calculateDemandIndicator(province, district)
        },
        recommendations: generateMarketRecommendations(priceDistribution, trends, popularAmenities)
      }
    });

  } catch (error) {
    console.error('❌ Error in getSearchInsights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get insights'
    });
  }
};

// Calculate price stability
function calculatePriceStability(trends) {
  if (trends.length < 2) return 'unknown';

  const prices = trends.map(t => t.avg_price).filter(p => p);
  if (prices.length < 2) return 'unknown';

  const average = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((a, b) => a + Math.pow(b - average, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const coefficient = stdDev / average;

  if (coefficient < 0.1) return 'very_stable';
  if (coefficient < 0.2) return 'stable';
  if (coefficient < 0.3) return 'moderate';
  return 'volatile';
}

// Calculate demand indicator
async function calculateDemandIndicator(province, district) {
  try {
    // This is a simplified calculation - in production, you'd use actual booking/query data
    const sql = `
      SELECT 
        COUNT(*) as total_properties,
        SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured,
        SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified,
        AVG(DATEDIFF(NOW(), created_at)) as avg_age_days
      FROM properties
      WHERE status = 'active'
        ${province ? 'AND province = ?' : ''}
        ${district ? 'AND district = ?' : ''}
    `;

    const values = [];
    if (province) values.push(mapProvinceToDb(province));
    if (district) values.push(district);

    const result = await isanzureQuery(sql, values);
    const stats = result[0] || { total_properties: 0, featured: 0, verified: 0, avg_age_days: 0 };

    // Simple heuristic for demand
    if (stats.total_properties === 0) return 'unknown';

    const featuredRatio = stats.featured / stats.total_properties;
    const verifiedRatio = stats.verified / stats.total_properties;
    const avgAge = stats.avg_age_days;

    let score = 0;
    if (featuredRatio > 0.3) score += 2;
    if (verifiedRatio > 0.4) score += 2;
    if (avgAge < 30) score += 2; // Newer properties suggest higher demand

    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';

  } catch (error) {
    return 'unknown';
  }
}

// Generate market recommendations
function generateMarketRecommendations(priceDistribution, trends, popularAmenities) {
  const recommendations = [];

  // Price range recommendation
  if (priceDistribution.length > 0) {
    const largestSegment = priceDistribution.reduce((max, curr) =>
      curr.property_count > max.property_count ? curr : max
    );

    if (largestSegment.percentage > 40) {
      recommendations.push({
        type: 'price_range',
        message: `Most properties (${largestSegment.percentage}%) are in the ${largestSegment.price_range} range`,
        suggestion: 'Consider this price range for competitive pricing'
      });
    }
  }

  // Amenity recommendation
  if (popularAmenities.length > 0) {
    const topAmenity = popularAmenities[0];
    if (topAmenity.percentage > 60) {
      recommendations.push({
        type: 'amenity',
        message: `${topAmenity.amenity_name} is available in ${topAmenity.percentage}% of properties`,
        suggestion: 'This is an expected feature in most properties'
      });
    }
  }

  // Trend recommendation
  if (trends.length >= 7) {
    const recentWeek = trends.slice(0, 7);
    const previousWeek = trends.slice(7, 14);

    if (recentWeek.length === 7 && previousWeek.length === 7) {
      const recentAvg = recentWeek.reduce((sum, day) => sum + (day.avg_price || 0), 0) / 7;
      const previousAvg = previousWeek.reduce((sum, day) => sum + (day.avg_price || 0), 0) / 7;

      const change = ((recentAvg - previousAvg) / previousAvg) * 100;

      if (Math.abs(change) > 10) {
        recommendations.push({
          type: 'trend',
          message: `Prices have ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% in the last week`,
          suggestion: change > 0 ? 'Prices are rising - consider listing soon' : 'Good time to find deals'
        });
      }
    }
  }

  return recommendations;
}

module.exports = {
  advancedSearch: exports.advancedSearch,
  intelligentSearch: exports.intelligentSearch,
  getPopularSearches: exports.getPopularSearches,
  getAutocomplete: exports.getAutocomplete,
  getSearchFilters: exports.getSearchFilters,
  getSearchInsights: exports.getSearchInsights
};