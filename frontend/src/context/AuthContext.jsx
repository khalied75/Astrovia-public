import { useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { api } from "../services/api";
import { AuthContext } from "./auth-context";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

async function syncUser(user, forceRefresh = false) {
  if (!user) return null;
  return api.syncCurrentUser(await user.getIdToken(forceRefresh));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      setIsAdmin(false);
      setProfileError("");
      if (firebaseUser) {
        try {
          const [nextProfile, tokenResult] = await Promise.all([
            syncUser(firebaseUser),
            firebaseUser.getIdTokenResult(),
          ]);
          setProfile(nextProfile);
          setIsAdmin(tokenResult.claims.admin === true);
        } catch (error) {
          setProfile(null);
          setProfileError(error.message);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      isAdmin,
      profileError,
      loading,
      signInWithGoogle: () => signInWithPopup(auth, googleProvider),
      signInWithApple: () => signInWithPopup(auth, appleProvider),
      signInWithEmail: (email, password) =>
        signInWithEmailAndPassword(auth, email, password),
      createAccount: async (name, email, password) => {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await updateFirebaseProfile(result.user, { displayName: name });
        const token = await result.user.getIdToken(true);
        await syncUser(result.user);
        setProfile(await api.updateProfile(token, { displayName: name }));
        return result;
      },
      resetPassword: (email) => sendPasswordResetEmail(auth, email),
      signOut: () => signOut(auth),
      refreshProfile: async () => {
        try {
          const nextProfile = await syncUser(auth.currentUser, true);
          const tokenResult = await auth.currentUser.getIdTokenResult();
          setProfile(nextProfile);
          setIsAdmin(tokenResult.claims.admin === true);
          setProfileError("");
          return nextProfile;
        } catch (error) {
          setProfileError(error.message);
          throw error;
        }
      },
      saveProfile: async (updates) => {
        const currentUser = auth.currentUser;
        await updateFirebaseProfile(currentUser, {
          displayName: updates.displayName,
          photoURL: updates.photoURL || null,
        });
        const token = await currentUser.getIdToken(true);
        const nextProfile = await api.updateProfile(token, updates);
        setProfile(nextProfile);
        return nextProfile;
      },
    }),
    [isAdmin, loading, profile, profileError, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
