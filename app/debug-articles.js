// Debug script to check articles with featured images
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyBk7arB4Zzb4mT6iM0v2Y7nQWJq1NFVMtE",
  authDomain: "dgnov3.firebaseapp.com",
  projectId: "dgnov3",
  storageBucket: "dgnov3.firebasestorage.app",
  messagingSenderId: "275614143692",
  appId: "1:275614143692:web:ba683815489169b064aaf9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkArticles() {
  try {
    console.log('Fetching published articles...');
    const q = query(collection(db, 'articles'), where('status', '==', 'published'));
    const snapshot = await getDocs(q);
    
    console.log(`Found ${snapshot.docs.length} published articles`);
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\nArticle ${index + 1}:`);
      console.log('- ID:', doc.id);
      console.log('- Title:', data.title);
      console.log('- Featured Image URL:', data.featuredImageUrl || 'NONE');
      console.log('- Featured Image ID:', data.featuredImageId || 'NONE');
      console.log('- Status:', data.status);
    });
    
  } catch (error) {
    console.error('Error fetching articles:', error);
  }
}

checkArticles();