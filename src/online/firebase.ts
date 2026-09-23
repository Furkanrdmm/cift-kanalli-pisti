// Firebase bağlantısı: anonim giriş + Realtime Database
// Bu bilgiler gizli değil (her tarayıcıya gider); güvenliği veritabanı kuralları sağlar.
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyDqPSIB8AtRieNv-jxTZqHwnr3hteFMT0g',
  authDomain: 'cift-kanalli-pisti.firebaseapp.com',
  databaseURL: 'https://cift-kanalli-pisti-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'cift-kanalli-pisti',
  storageBucket: 'cift-kanalli-pisti.firebasestorage.app',
  messagingSenderId: '909017754245',
  appId: '1:909017754245:web:6c179683844c255b0a97ec',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)

let uidPromise: Promise<string> | null = null

/** Anonim giriş yap (bir kere), kullanıcı kimliğini döndür */
export function ensureAuth(): Promise<string> {
  uidPromise ??= new Promise<string>((resolve, reject) => {
    const off = onAuthStateChanged(auth, (user) => {
      if (user) {
        off()
        resolve(user.uid)
      }
    })
    signInAnonymously(auth).catch((e) => {
      off()
      uidPromise = null
      reject(e)
    })
  })
  return uidPromise
}
