import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { getDeviceId } from "./deviceService";

export const loginWithDevice = async (): Promise<User | null> => {
  const deviceId = await getDeviceId();
  const email = `${deviceId}@puzzle.game`;
  const password = `pass_${deviceId.slice(0, 8)}!`; // Cihaza özel sabit şifre

  try {
    // Giriş yapmayı dene
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("🔐 Firebase: Giriş başarılı", userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    // Eğer kullanıcı yoksa yeni oluştur
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/invalid-credential"
    ) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log(
          "🔐 Firebase: Yeni kullanıcı oluşturuldu",
          userCredential.user.uid
        );
        return userCredential.user;
      } catch (createError) {
        console.error("🔐 Firebase: Kayıt hatası", createError);
        return null;
      }
    }
    console.error("🔐 Firebase: Auth hatası", error);
    return null;
  }
};

export const getCurrentUser = (): User | null => auth.currentUser;

export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};
