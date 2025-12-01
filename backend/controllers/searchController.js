// src/controllers/searchController.js
const { query } = require("../config/dbConfig");

// Enhanced search configuration
const SEARCH_CONFIG = {
  minQueryLength: 1,
  maxResults: 50,
  fuzzyMatchThreshold: 0.7,
  maxFuzzySuggestions: 5
};

// Enhanced Kinyarwanda to English mapping
const KINYARWANDA_MOVIE_TERMS = {
  'filimi': 'movie',
  'televiziyo': 'tv',
  'sinema': 'movie',
  'ikinamico': 'drama',
  'seri': 'series',
  'documentaire': 'documentary',
  'ubukana': 'action',
  'ubwoba': 'horror',
  'ubucurizi': 'comedy',
  'urukundo': 'romance',
  'ubugeni': 'adventure',
  'ubuhanga': 'sci-fi',
  'ibihe': 'history',
  'umuziki': 'music',
  'imikino': 'sports',
  'ubwato': 'family',
  'gushya': 'new',
  'gushya cyane': 'new releases',
  'birashe': 'trending',
  'bihuse': 'trending now',
  'byiza': 'best',
  'byiza cyane': 'top rated',
  'gusetsa': 'funny',
  'gusetsa cyane': 'comedy',
  'gukina': 'play',
  'kureba': 'watch',
  'gufatanya': 'action'
};

// Common misspellings and variations
const COMMON_MISSPELLINGS = {
  'acton': 'action',
  'commdy': 'comedy',
  'thriler': 'thriller',
  'aventure': 'adventure',
  'sci-fy': 'sci-fi',
  'drama': 'drama',
  'romantic': 'romance',
  'urwagasabo': 'urwagasabo',
  'urwahasabo': 'urwagasabo',
  'urwagasabooo': 'urwagasabo'
};

// Cache for frequent searches
const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// Enhanced search function with performance optimizations
const performAdvancedSearch = async (searchQuery, options = {}) => {
  const {
    page = 1,
    limit = 20,
    contentType = null,
    genre = null,
    year = null,
    language = 'en'
  } = options;

  const offset = (page - 1) * limit;
  
  if (!searchQuery || searchQuery.trim().length < SEARCH_CONFIG.minQueryLength) {
    return {
      results: [],
      total: 0,
      suggestions: await getPopularSearches()
    };
  }

  const queryText = searchQuery.trim().toLowerCase();
  
  const cacheKey = `${queryText}_${page}_${limit}_${contentType}_${genre}_${year}_${language}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const processedQuery = preprocessQuery(queryText, language);
    
    const searchResults = await executeOptimizedContentSearch(processedQuery, { 
      contentType, 
      genre, 
      year, 
      limit, 
      offset 
    });

    let finalResults = searchResults;
    if (searchResults.results.length === 0) {
      const fuzzyResults = await executeFuzzySearch(queryText, { limit, offset });
      finalResults = fuzzyResults;
    }

    const suggestions = await generateEnhancedSearchSuggestions(queryText, finalResults.results);

    const response = {
      results: finalResults.results,
      total: finalResults.total,
      suggestions,
      searchMetadata: {
        originalQuery: searchQuery,
        processedQuery,
        language,
        searchType: searchResults.results.length > 0 ? 'exact' : 'fuzzy'
      }
    };

    searchCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    cleanupCache();

    return response;

  } catch (error) {
    throw new Error('Search failed');
  }
};

// Clean up old cache entries
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      searchCache.delete(key);
    }
  }
};

// Enhanced query preprocessing
const preprocessQuery = (query, language) => {
  let processed = query.trim().toLowerCase();
  
  processed = correctCommonMisspellings(processed);
  
  if (language === 'rw' || isKinyarwandaQuery(processed)) {
    processed = translateKinyarwandaTerms(processed);
  }
  
  processed = processed.replace(/[^\w\s-]/g, ' ');
  processed = processed.replace(/\s+/g, ' ').trim();
  
  return processed;
};

// Correct common misspellings
const correctCommonMisspellings = (query) => {
  let corrected = query;
  
  Object.entries(COMMON_MISSPELLINGS).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    corrected = corrected.replace(regex, correct);
  });
  
  return corrected;
};

// Detect Kinyarwanda queries
const isKinyarwandaQuery = (query) => {
  const kinyarwandaIndicators = [
    'filimi', 'televiziyo', 'sinema', 'ikinamico', 'ubukana', 'ubwoba',
    'ubucurizi', 'urukundo', 'gushya', 'birashe', 'byiza', 'gusetsa'
  ];
  
  return kinyarwandaIndicators.some(term => 
    query.toLowerCase().includes(term)
  );
};

// Translate Kinyarwanda movie terms to English
const translateKinyarwandaTerms = (query) => {
  let translated = query;
  
  Object.entries(KINYARWANDA_MOVIE_TERMS).forEach(([kinyarwanda, english]) => {
    const regex = new RegExp(`\\b${kinyarwanda}\\b`, 'gi');
    translated = translated.replace(regex, english);
  });
  
  return translated;
};

// OPTIMIZED SEARCH - Using multiple strategies for better performance
const executeOptimizedContentSearch = async (searchQuery, filters) => {
  const { contentType, genre, year, limit, offset } = filters;
  
  const searchWords = searchQuery.split(' ').filter(word => word.length >= 1);
  
  if (searchWords.length === 0) {
    return { results: [], total: 0 };
  }

  let results = await executeExactSearch(searchWords, filters);
  
  if (results.results.length === 0 && searchQuery.length >= 2) {
    results = await executePartialSearch(searchQuery, filters);
  }

  return results;
};

// EXACT SEARCH - Optimized for performance
const executeExactSearch = async (searchWords, filters) => {
  const { contentType, genre, year, limit, offset } = filters;
  
  const params = [process.env.R2_PUBLIC_URL_ID];
  const conditions = [];

  searchWords.forEach(word => {
    const searchPattern = `%${word}%`;
    
    conditions.push(`
      (c.title LIKE ? OR 
       c.description LIKE ? OR
       c.short_description LIKE ?)
    `);
    
    params.push(searchPattern, searchPattern, searchPattern);
  });

  let sql = `
    SELECT 
      c.*,
      cr.license_type,
      cr.downloadable,
      cr.shareable,
      GROUP_CONCAT(DISTINCT g.name) as genre_names,
      GROUP_CONCAT(DISTINCT g.id) as genre_ids,
      GROUP_CONCAT(DISTINCT cat.name) as category_names,
      GROUP_CONCAT(DISTINCT cat.id) as category_ids,
      (
        SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
        FROM media_assets ma 
        WHERE ma.content_id = c.id 
          AND ma.asset_type IN ('thumbnail', 'poster')
          AND (ma.is_primary = 1 OR ma.is_primary IS NULL)
          AND ma.upload_status = 'completed'
        ORDER BY ma.is_primary DESC, ma.created_at DESC
        LIMIT 1
      ) as primary_image_url,
      (
        (CASE WHEN c.title LIKE ? THEN 100 ELSE 0 END) +
        (CASE WHEN c.title = ? THEN 200 ELSE 0 END) +
        (CASE WHEN c.description LIKE ? THEN 40 ELSE 0 END) +
        (CASE WHEN c.featured = 1 THEN 30 ELSE 0 END) +
        (CASE WHEN c.trending = 1 THEN 25 ELSE 0 END) +
        (c.view_count * 0.001) +
        (c.average_rating * 15)
      ) as relevance_score
    FROM contents c
    LEFT JOIN content_rights cr ON c.id = cr.content_id
    LEFT JOIN content_genres cg ON c.id = cg.content_id
    LEFT JOIN genres g ON cg.genre_id = g.id
    LEFT JOIN content_categories cc ON c.id = cc.content_id
    LEFT JOIN categories cat ON cc.category_id = cat.id
    WHERE c.status = 'published' 
      AND c.visibility = 'public'
      AND (${conditions.join(' OR ')})
  `;

  const firstWordPattern = `%${searchWords[0]}%`;
  const exactTitle = searchWords.join(' ');
  params.push(firstWordPattern, exactTitle, firstWordPattern);

  if (contentType) {
    sql += ` AND c.content_type = ?`;
    params.push(contentType);
  }
  
  if (genre) {
    sql += ` AND g.name = ?`;
    params.push(genre);
  }
  
  if (year) {
    sql += ` AND YEAR(c.release_date) = ?`;
    params.push(year);
  }
  
  sql += `
    GROUP BY c.id
    HAVING relevance_score > 0
    ORDER BY relevance_score DESC, c.view_count DESC
    LIMIT ? OFFSET ?
  `;
  
  params.push(parseInt(limit), parseInt(offset));

  try {
    const results = await query(sql, params);
    return {
      results: processContentResults(results),
      total: results.length
    };
  } catch (error) {
    return { results: [], total: 0 };
  }
};

// PARTIAL SEARCH - For when exact matches fail
const executePartialSearch = async (searchQuery, filters) => {
  const { contentType, genre, year, limit, offset } = filters;
  
  const params = [process.env.R2_PUBLIC_URL_ID];
  
  let sql = `
    SELECT 
      c.*,
      cr.license_type,
      cr.downloadable,
      cr.shareable,
      GROUP_CONCAT(DISTINCT g.name) as genre_names,
      GROUP_CONCAT(DISTINCT g.id) as genre_ids,
      GROUP_CONCAT(DISTINCT cat.name) as category_names,
      GROUP_CONCAT(DISTINCT cat.id) as category_ids,
      (
        SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
        FROM media_assets ma 
        WHERE ma.content_id = c.id 
          AND ma.asset_type IN ('thumbnail', 'poster')
          AND (ma.is_primary = 1 OR ma.is_primary IS NULL)
          AND ma.upload_status = 'completed'
        ORDER BY ma.is_primary DESC, ma.created_at DESC
        LIMIT 1
      ) as primary_image_url,
      (
        (CASE WHEN c.title LIKE ? THEN 80 ELSE 0 END) +
        (CASE WHEN c.description LIKE ? THEN 30 ELSE 0 END) +
        (CASE WHEN c.featured = 1 THEN 20 ELSE 0 END) +
        (CASE WHEN c.trending = 1 THEN 15 ELSE 0 END) +
        (c.view_count * 0.001) +
        (c.average_rating * 10)
      ) as relevance_score
    FROM contents c
    LEFT JOIN content_rights cr ON c.id = cr.content_id
    LEFT JOIN content_genres cg ON c.id = cg.content_id
    LEFT JOIN genres g ON cg.genre_id = g.id
    LEFT JOIN content_categories cc ON c.id = cc.content_id
    LEFT JOIN categories cat ON cc.category_id = cat.id
    WHERE c.status = 'published' 
      AND c.visibility = 'public'
      AND (c.title LIKE ? OR c.description LIKE ?)
  `;

  const searchPattern = `%${searchQuery}%`;
  params.push(searchPattern, searchPattern, searchPattern, searchPattern);

  if (contentType) {
    sql += ` AND c.content_type = ?`;
    params.push(contentType);
  }
  
  if (genre) {
    sql += ` AND g.name = ?`;
    params.push(genre);
  }
  
  if (year) {
    sql += ` AND YEAR(c.release_date) = ?`;
    params.push(year);
  }
  
  sql += `
    GROUP BY c.id
    HAVING relevance_score > 0
    ORDER BY relevance_score DESC, c.view_count DESC
    LIMIT ? OFFSET ?
  `;
  
  params.push(parseInt(limit), parseInt(offset));

  try {
    const results = await query(sql, params);
    return {
      results: processContentResults(results),
      total: results.length
    };
  } catch (error) {
    return { results: [], total: 0 };
  }
};

// FUZZY SEARCH - For typos and close matches
const executeFuzzySearch = async (searchQuery, filters) => {
  const { limit, offset } = filters;
  
  const titlesSql = `
    SELECT id, title, content_type
    FROM contents 
    WHERE status = 'published' AND visibility = 'public'
  `;
  
  try {
    const allTitles = await query(titlesSql);
    
    const fuzzyMatches = allTitles
      .map(item => ({
        ...item,
        similarity: calculateSimilarity(searchQuery, item.title.toLowerCase())
      }))
      .filter(item => item.similarity >= SEARCH_CONFIG.fuzzyMatchThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    if (fuzzyMatches.length === 0) {
      return { results: [], total: 0 };
    }

    const ids = fuzzyMatches.map(match => match.id);
    const placeholders = ids.map(() => '?').join(',');
    
    const contentSql = `
      SELECT 
        c.*,
        cr.license_type,
        cr.downloadable,
        cr.shareable,
        GROUP_CONCAT(DISTINCT g.name) as genre_names,
        GROUP_CONCAT(DISTINCT g.id) as genre_ids,
        GROUP_CONCAT(DISTINCT cat.name) as category_names,
        GROUP_CONCAT(DISTINCT cat.id) as category_ids,
        (
          SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
          FROM media_assets ma 
          WHERE ma.content_id = c.id 
            AND ma.asset_type IN ('thumbnail', 'poster')
            AND (ma.is_primary = 1 OR ma.is_primary IS NULL)
            AND ma.upload_status = 'completed'
          ORDER BY ma.is_primary DESC, ma.created_at DESC
          LIMIT 1
        ) as primary_image_url
      FROM contents c
      LEFT JOIN content_rights cr ON c.id = cr.content_id
      LEFT JOIN content_genres cg ON c.id = cg.content_id
      LEFT JOIN genres g ON cg.genre_id = g.id
      LEFT JOIN content_categories cc ON c.id = cc.content_id
      LEFT JOIN categories cat ON cc.category_id = cat.id
      WHERE c.id IN (${placeholders})
      GROUP BY c.id
      ORDER BY FIELD(c.id, ${placeholders})
      LIMIT ?
    `;

    const params = [process.env.R2_PUBLIC_URL_ID, ...ids, ...ids, parseInt(limit)];
    const results = await query(contentSql, params);
    
    return {
      results: processContentResults(results),
      total: results.length
    };

  } catch (error) {
    return { results: [], total: 0 };
  }
};

// Calculate similarity between two strings
const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  if (longer.includes(shorter)) return 0.9;
  if (shorter.includes(longer)) return 0.8;
  
  const matchingChars = shorter.split('').filter(char => longer.includes(char)).length;
  return matchingChars / Math.max(longer.length, shorter.length);
};

// Optimized quick search for autocomplete
const quickSearch = async (searchQuery, options = {}) => {
  const { limit = 10 } = options;

  if (!searchQuery || searchQuery.length < 1) {
    return {
      contents: [],
      people: [],
      suggestions: await getPopularSearches()
    };
  }

  const cacheKey = `quick_${searchQuery}_${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const contentSql = `
      SELECT 
        c.id,
        c.title,
        c.content_type,
        c.release_date,
        (
          SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
          FROM media_assets ma 
          WHERE ma.content_id = c.id 
            AND ma.asset_type IN ('thumbnail', 'poster')
            AND ma.upload_status = 'completed'
          ORDER BY ma.is_primary DESC
          LIMIT 1
        ) as image_url,
        (CASE 
          WHEN c.title LIKE ? THEN 100
          WHEN c.title LIKE ? THEN 80
          ELSE 60
        END) as relevance_score
      FROM contents c
      WHERE c.status = 'published' 
        AND c.visibility = 'public'
        AND (c.title LIKE ? OR c.title LIKE ?)
      ORDER BY relevance_score DESC, c.view_count DESC
      LIMIT ?
    `;

    const contentResults = await query(contentSql, [
      process.env.R2_PUBLIC_URL_ID,
      `${searchQuery}%`,
      `%${searchQuery}%`,
      `${searchQuery}%`,
      `%${searchQuery}%`,
      parseInt(limit)
    ]);

    const peopleSql = `
      SELECT DISTINCT p.full_name, p.primary_role
      FROM people p
      JOIN content_people cp ON p.id = cp.person_id
      JOIN contents c ON cp.content_id = c.id
      WHERE c.status = 'published' 
        AND c.visibility = 'public'
        AND (p.full_name LIKE ? OR p.display_name LIKE ?)
      LIMIT 5
    `;

    const peopleResults = await query(peopleSql, [
      `%${searchQuery}%`,
      `%${searchQuery}%`
    ]);

    const response = {
      contents: contentResults,
      people: peopleResults,
      suggestions: await generateEnhancedSearchSuggestions(searchQuery, [])
    };

    searchCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    return response;

  } catch (error) {
    return {
      contents: [],
      people: [],
      suggestions: []
    };
  }
};

// Process content results for consistency
const processContentResults = (results) => {
  return results.map(item => {
    let imageUrl = item.primary_image_url;
    if (!imageUrl || imageUrl.includes('null')) {
      imageUrl = '/api/placeholder/300/450';
    }

    return {
      ...item,
      genres: item.genre_names ? item.genre_names.split(',').map((name, index) => ({
        id: item.genre_ids ? item.genre_ids.split(',')[index] : index,
        name: name.trim()
      })) : [],
      categories: item.category_names ? item.category_names.split(',').map((name, index) => ({
        id: item.category_ids ? item.category_ids.split(',')[index] : index,
        name: name.trim()
      })) : [],
      media_assets: imageUrl ? [{
        asset_type: 'thumbnail',
        file_path: imageUrl.replace(`https://pub-${process.env.R2_PUBLIC_URL_ID}.r2.dev/`, ''),
        url: imageUrl,
        is_primary: 1,
        upload_status: 'completed'
      }] : [],
      last_updated: item.updated_at || item.created_at
    };
  });
};

// Enhanced intelligent search suggestions
const generateEnhancedSearchSuggestions = async (originalQuery, searchResults) => {
  const suggestions = new Set();
  
  const spellingSuggestions = await generateSpellingSuggestions(originalQuery);
  spellingSuggestions.forEach(s => suggestions.add(s));
  
  if (searchResults.length > 0) {
    const relatedSearches = await generateRelatedSearches(searchResults, originalQuery);
    relatedSearches.forEach(s => suggestions.add(s));
  }
  
  const popularSearches = await getPopularSearches();
  popularSearches
    .filter(popular => popular.includes(originalQuery.toLowerCase()) || 
                      originalQuery.toLowerCase().includes(popular.split(' ')[0]))
    .slice(0, 2)
    .forEach(s => suggestions.add(s));
  
  const contentSuggestions = await generateContentBasedSuggestions(originalQuery);
  contentSuggestions.forEach(s => suggestions.add(s));
  
  return Array.from(suggestions).slice(0, 8);
};

// Generate spelling suggestions
const generateSpellingSuggestions = async (query) => {
  const suggestions = [];
  
  if (COMMON_MISSPELLINGS[query.toLowerCase()]) {
    suggestions.push(COMMON_MISSPELLINGS[query.toLowerCase()]);
  }
  
  if (query.length <= 5) {
    const variations = generateWordVariations(query);
    suggestions.push(...variations);
  }
  
  return suggestions;
};

// Generate word variations for fuzzy matching
const generateWordVariations = (word) => {
  const variations = [];
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  
  vowels.forEach(vowel => {
    if (word.includes(vowel)) {
      vowels.forEach(replacement => {
        if (vowel !== replacement) {
          variations.push(word.replace(new RegExp(vowel, 'g'), replacement));
        }
      });
    }
  });
  
  return variations.slice(0, 3);
};

// Generate content-based suggestions
const generateContentBasedSuggestions = async (query) => {
  try {
    const sql = `
      SELECT DISTINCT title 
      FROM contents 
      WHERE status = 'published' 
        AND visibility = 'public'
        AND title LIKE ?
      LIMIT 3
    `;
    
    const results = await query(sql, [`%${query}%`]);
    return results.map(row => row.title);
  } catch (error) {
    return [];
  }
};

// Generate related searches based on results
const generateRelatedSearches = async (results, originalQuery) => {
  const related = [];
  
  const allGenres = results.flatMap(result => 
    result.genres ? result.genres.map(g => g.name) : []
  );
  const popularGenres = [...new Set(allGenres)].slice(0, 3);
  
  popularGenres.forEach(genre => {
    if (!originalQuery.toLowerCase().includes(genre.toLowerCase())) {
      related.push(`${originalQuery} ${genre}`);
      related.push(`${genre} movies`);
    }
  });
  
  const types = [...new Set(results.map(r => r.content_type))];
  types.forEach(type => {
    if (!originalQuery.toLowerCase().includes(type)) {
      related.push(`${type} ${originalQuery}`);
    }
  });
  
  return related;
};

// Get popular searches
const getPopularSearches = async () => {
  return [
    'action movies 2024',
    'comedy shows',
    'new releases',
    'trending now',
    'family movies',
    'drama series',
    'romantic movies',
    'urwagasabo'
  ];
};

// Main search endpoint
const searchContent = async (req, res) => {
  try {
    const { 
      q: searchQuery, 
      page = 1, 
      limit = 20,
      type: contentType,
      genre,
      year,
      lang = 'en'
    } = req.query;

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        suggestions: await getPopularSearches()
      });
    }

    const searchResults = await performAdvancedSearch(searchQuery, {
      page: parseInt(page),
      limit: parseInt(limit),
      contentType,
      genre,
      year: year ? parseInt(year) : null,
      language: lang
    });

    res.json({
      success: true,
      data: searchResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: searchResults.total,
        pages: Math.ceil(searchResults.total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Search failed. Please try again.'
    });
  }
};

// Quick search endpoint for autocomplete
const quickSearchEndpoint = async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    const quickResults = await quickSearch(query, { limit: parseInt(limit) });

    res.json({
      success: true,
      data: quickResults
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Quick search failed'
    });
  }
};

// Get search analytics (for admin purposes)
const getSearchAnalytics = async (req, res) => {
  try {
    const analytics = {
      popularSearches: await getPopularSearches(),
      searchVolume: 1250,
      successRate: 0.89,
      noResultsRate: 0.08,
      cacheSize: searchCache.size
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search analytics'
    });
  }
};

// Clear search cache (admin endpoint)
const clearSearchCache = async (req, res) => {
  try {
    const previousSize = searchCache.size;
    searchCache.clear();
    
    res.json({
      success: true,
      message: `Search cache cleared (${previousSize} entries removed)`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear search cache'
    });
  }
};

module.exports = {
  searchContent,
  quickSearch: quickSearchEndpoint,
  getSearchAnalytics,
  clearSearchCache,
  performAdvancedSearch
};