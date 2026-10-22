import fs from 'node:fs';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-careerdesk-rules',
    firestore: {
      rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8')
    }
  });
});

after(async () => {
  await env?.cleanup();
});

test('unauthenticated users can read a public username reservation without private fields', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'usernames/alice'), {
      username: 'alice',
      updatedAt: 123
    });
  });

  const snapshot = await assertSucceeds(
    getDoc(doc(env.unauthenticatedContext().firestore(), 'usernames/alice'))
  );
  assert.deepEqual(Object.keys(snapshot.data()).sort(), ['updatedAt', 'username']);
  assert.equal(snapshot.data().email, undefined);
  assert.equal(snapshot.data().uid, undefined);
});

test('unauthenticated users can check that an unclaimed username does not exist', async () => {
  const snapshot = await assertSucceeds(
    getDoc(doc(env.unauthenticatedContext().firestore(), 'usernames/available-name'))
  );
  assert.equal(snapshot.exists(), false);
});

test('legacy username documents containing email or UID are not publicly readable', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'usernames/legacyuser'), {
      username: 'legacyuser',
      email: 'legacy@example.com',
      uid: 'legacy-uid',
      updatedAt: 123
    });
  });

  await assertFails(
    getDoc(doc(env.unauthenticatedContext().firestore(), 'usernames/legacyuser'))
  );
});

test('unauthenticated users cannot read user profile documents', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'users/private-user'), {
      username: 'privateuser',
      email: 'private@example.com'
    });
  });

  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'users/private-user')));
});

test('a signed-in user can atomically create their own username reservation', async () => {
  const db = env.authenticatedContext('uid-alice').firestore();
  const batch = writeBatch(db);
  batch.set(doc(db, 'users/uid-alice'), { username: 'alice' }, { merge: true });
  batch.set(doc(db, 'usernames/alice'), { username: 'alice', updatedAt: 123 });
  await assertSucceeds(batch.commit());
});

test('username reservations cannot contain email or UID fields', async () => {
  const db = env.authenticatedContext('uid-alice').firestore();
  const batch = writeBatch(db);
  batch.set(doc(db, 'users/uid-alice'), { username: 'alice' }, { merge: true });
  batch.set(doc(db, 'usernames/alice'), {
    username: 'alice',
    email: 'private@example.com',
    uid: 'uid-alice',
    updatedAt: 123
  });
  await assertFails(batch.commit());
});

test('a username cannot be reserved without a matching user profile', async () => {
  const db = env.authenticatedContext('uid-alice').firestore();
  await assertFails(setDoc(doc(db, 'usernames/alice'), {
    username: 'alice',
    updatedAt: 123
  }));
});

test('an existing username reservation cannot be overwritten by another user', async () => {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'users/uid-alice'), { username: 'alice' });
    await setDoc(doc(db, 'usernames/alice'), { username: 'alice', updatedAt: 123 });
  });

  const db = env.authenticatedContext('uid-bob').firestore();
  const batch = writeBatch(db);
  batch.set(doc(db, 'users/uid-bob'), { username: 'alice' }, { merge: true });
  batch.set(doc(db, 'usernames/alice'), { username: 'alice', updatedAt: 456 }, { merge: true });
  await assertFails(batch.commit());
});

test('only the owner whose profile names the reservation can delete it', async () => {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'users/uid-alice'), { username: 'alice' });
    await setDoc(doc(db, 'users/uid-bob'), { username: 'bob' });
    await setDoc(doc(db, 'usernames/alice'), { username: 'alice', updatedAt: 123 });
  });

  await assertFails(deleteDoc(
    doc(env.authenticatedContext('uid-bob').firestore(), 'usernames/alice')
  ));
  await assertSucceeds(deleteDoc(
    doc(env.authenticatedContext('uid-alice').firestore(), 'usernames/alice')
  ));
});
