#!/usr/bin/env node

import process from 'node:process';
import { initializeApp } from 'firebase/app';
import { collection, doc, getDoc, getDocs, getFirestore, query, terminate, where } from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey: process.env.DGNO_FIREBASE_API_KEY || 'AIzaSyBn5GWdFHfWsdC8utmhZcXX9hMMnQG3xgU',
  authDomain: process.env.DGNO_FIREBASE_AUTH_DOMAIN || 'dgno-675a8.firebaseapp.com',
  projectId: process.env.DGNO_FIREBASE_PROJECT_ID || 'dgno-675a8',
};

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

function usage() {
  console.log(`DGNO read-only tracker inspector

Commands:
  node app/scripts/dgno-editorial.mjs trackers list
  node app/scripts/dgno-editorial.mjs incidents list --tracker <id-or-slug>

This helper uses only public Firebase reads. It has no authentication or write commands.`);
}

function getOption(name, { required = false } = {}) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (required && (!value || value.startsWith('--'))) {
    throw new Error(`Missing required option ${name}`);
  }
  return value;
}

function timestampToIso(value) {
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(timestampToIso);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, timestampToIso(child)]));
  }
  return value;
}

function printJson(value) {
  console.log(JSON.stringify(timestampToIso(value), null, 2));
}

async function resolveTracker(reference) {
  if (/^[A-Za-z0-9]{20}$/.test(reference)) {
    const byId = await getDoc(doc(db, 'trackers', reference));
    if (byId.exists() && byId.data().isActive === true) return { id: byId.id, ...byId.data() };
  }

  const snapshot = await getDocs(
    query(collection(db, 'trackers'), where('slug', '==', reference), where('isActive', '==', true)),
  );
  if (snapshot.empty) throw new Error(`Active tracker not found: ${reference}`);
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

async function loadActiveIncidents(trackerId) {
  const snapshot = await getDocs(
    query(
      collection(db, 'trackerIncidents'),
      where('trackerId', '==', trackerId),
      where('status', '==', 'active'),
    ),
  );
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

async function listTrackers() {
  const snapshot = await getDocs(query(collection(db, 'trackers'), where('isActive', '==', true)));
  const trackers = snapshot.docs
    .map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        name: data.name,
        slug: data.slug,
        incidentCount: data.incidentCount,
        useCustomFields: data.useCustomFields,
        customFields: (data.customFields || []).map(({ id, name, type, required, options, maxLength, order }) => ({
          id,
          name,
          type,
          required,
          options,
          maxLength,
          order,
        })),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
  printJson(trackers);
}

async function listIncidents() {
  const tracker = await resolveTracker(getOption('--tracker', { required: true }));
  const incidents = await loadActiveIncidents(tracker.id);
  printJson({
    tracker: { id: tracker.id, name: tracker.name, slug: tracker.slug, storedIncidentCount: tracker.incidentCount },
    activeIncidentCount: incidents.length,
    incidents: incidents.map((incident) => ({
      id: incident.id,
      dateOfOccurrence: incident.dateOfOccurrence,
      customData: incident.customData,
      editorialEvidence: incident.editorialEvidence,
      updatedAt: incident.updatedAt,
    })),
  });
}

async function main() {
  const [resource, action] = process.argv.slice(2);
  if (!resource || ['help', '--help', '-h'].includes(resource)) return usage();
  if (resource === 'trackers' && action === 'list') return listTrackers();
  if (resource === 'incidents' && action === 'list') return listIncidents();
  throw new Error(`Unknown or write-capable command rejected: ${resource} ${action || ''}`.trim());
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  console.error(`DGNO tracker inspector: ${error instanceof Error ? error.message : String(error)}`);
  exitCode = 1;
} finally {
  await terminate(db);
}
process.exitCode = exitCode;
