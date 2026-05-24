const AIRTABLE_API_ROOT = 'https://api.airtable.com/v0';

const requiredEnv = ['AIRTABLE_TOKEN', 'AIRTABLE_BASE_ID'];

function envValue(key, fallback = '') {
  return (process.env[key] || fallback).trim();
}

function getConfig() {
  const missing = requiredEnv.filter((key) => !envValue(key));
  if (missing.length) {
    const error = new Error(`Missing required environment variables: ${missing.join(', ')}`);
    error.statusCode = 500;
    error.publicDetail = `Missing env vars: ${missing.join(', ')}`;
    throw error;
  }

  return {
    token: envValue('AIRTABLE_TOKEN'),
    baseId: envValue('AIRTABLE_BASE_ID'),
    projectsTable: envValue('AIRTABLE_PROJECTS_TABLE', 'projects'),
    categoriesTable: envValue('AIRTABLE_CATEGORIES_TABLE'),
  };
}

function maskIdentifier(value = '') {
  if (!value) return '';
  if (value.length <= 8) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function publicConfig(config) {
  return {
    baseId: maskIdentifier(config.baseId),
    projectsTable: config.projectsTable,
    categoriesTableConfigured: Boolean(config.categoriesTable),
  };
}

function fieldValue(fields, name, fallback = '') {
  return fields && Object.prototype.hasOwnProperty.call(fields, name) ? fields[name] : fallback;
}

function boolValue(value) {
  return value === true || value === 'TRUE' || value === 'true' || value === 1;
}

function arrayValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function listValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function fetchAirtableRecords(config, tableName, params = {}) {
  const records = [];
  let offset;

  do {
    const searchParams = new URLSearchParams(params);
    if (offset) searchParams.set('offset', offset);

    const url = `${AIRTABLE_API_ROOT}/${config.baseId}/${encodeURIComponent(tableName)}?${searchParams}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const details = await response.text();
      const error = new Error(`Airtable request failed for ${tableName}: ${response.status} ${details}`);
      error.statusCode = response.status;
      error.publicDetail = `Airtable ${tableName} request failed with status ${response.status}`;

      try {
        const parsed = JSON.parse(details);
        if (parsed.error) {
          const type = parsed.error.type || parsed.error;
          const message = parsed.error.message ? `: ${parsed.error.message}` : '';
          error.publicDetail = `${error.publicDetail} (${type}${message})`;
        }
      } catch {
        // Keep the generic public detail when Airtable returns non-JSON.
      }

      throw error;
    }

    const payload = await response.json();
    records.push(...(payload.records || []));
    offset = payload.offset;
  } while (offset);

  return records;
}

function normalizeCategory(record) {
  const fields = record.fields || {};
  return {
    id: record.id,
    name: fieldValue(fields, 'Category Name'),
    sortOrder: numberValue(fieldValue(fields, 'Sort Order'), 999),
  };
}

function categoryNameFromField(categoryField, categoriesById) {
  if (Array.isArray(categoryField)) {
    return categoryField
      .map((value) => categoriesById.get(value) || value)
      .find(Boolean) || '';
  }

  return categoryField || '';
}

function fallbackCategoriesFromProjects(projects) {
  const seen = new Set();
  return projects
    .map((project) => project.category)
    .filter(Boolean)
    .filter((category) => {
      if (seen.has(category)) return false;
      seen.add(category);
      return true;
    })
    .map((name, index) => ({
      id: name,
      name,
      sortOrder: index + 1,
    }));
}

function normalizeProject(record, categoriesById) {
  const fields = record.fields || {};
  const projectName = fieldValue(fields, 'Project Name');
  const subtitle = fieldValue(fields, 'Subtitle');

  return {
    id: record.id,
    name: projectName,
    subtitle,
    title: subtitle ? `${projectName} - ${subtitle}` : projectName,
    overlineType: fieldValue(fields, 'Overline Type'),
    category: categoryNameFromField(fieldValue(fields, 'Category', []), categoriesById),
    description: fieldValue(fields, 'Description'),
    tags: arrayValue(fieldValue(fields, 'Tags', [])),
    isFeatured: boolValue(fieldValue(fields, 'Is Featured', false)),
    sortOrder: numberValue(fieldValue(fields, 'Sort Order'), 999),
    featuredContext: fieldValue(fields, 'Featured Context'),
    featuredMetrics: [1, 2, 3, 4]
      .map((index) => ({
        label: fieldValue(fields, `Featured Metric ${index} - Label`),
        value: fieldValue(fields, `Featured Metric ${index} - Value`),
      }))
      .filter((metric) => metric.label || metric.value),
    analysisDesignList: listValue(fieldValue(fields, 'Analysis & Design List', [])),
    financialDeliverablesList: listValue(fieldValue(fields, 'Financial & Deliverables List', [])),
  };
}

function groupProjects(projects, categories) {
  const categoriesWithProjects = categories
    .map((category) => ({
      name: category.name,
      sortOrder: category.sortOrder,
      projects: projects
        .filter((project) => project.category === category.name)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    }))
    .filter((category) => category.projects.length);

  const knownCategories = new Set(categoriesWithProjects.map((category) => category.name));
  const uncategorized = projects
    .filter((project) => !knownCategories.has(project.category))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  if (uncategorized.length) {
    categoriesWithProjects.push({
      name: 'Other Projects',
      sortOrder: 9999,
      projects: uncategorized,
    });
  }

  return categoriesWithProjects.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

module.exports = async function portfolioHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const config = getConfig();
    const [categoryRecords, projectRecords] = await Promise.all([
      config.categoriesTable
        ? fetchAirtableRecords(config, config.categoriesTable, {
            'sort[0][field]': 'Sort Order',
            'sort[0][direction]': 'asc',
          })
        : Promise.resolve([]),
      fetchAirtableRecords(config, config.projectsTable),
    ]);

    const categories = categoryRecords.map(normalizeCategory).filter((category) => category.name);
    const categoriesById = new Map(categories.map((category) => [category.id, category.name]));
    const projects = projectRecords.map((record) => normalizeProject(record, categoriesById));
    const featured = projects.find((project) => project.isFeatured) || null;
    const groupCategories = categories.length ? categories : fallbackCategoriesFromProjects(projects);
    const groups = groupProjects(projects.filter((project) => !project.isFeatured), groupCategories);

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).json({
      featured,
      groups,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    let configDebug;
    try {
      configDebug = publicConfig(getConfig());
    } catch {
      configDebug = undefined;
    }

    res.status(error.statusCode || 500).json({
      error: 'Unable to load portfolio content',
      detail: error.publicDetail || (process.env.NODE_ENV === 'development' ? error.message : undefined),
      config: configDebug,
    });
  }
};
