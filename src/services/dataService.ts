import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Chapter, Level } from "../types";

export const fetchChapters = async (): Promise<Chapter[]> => {
  try {
    const chaptersCol = collection(db, "chapters");
    const q = query(chaptersCol, orderBy("id", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
        } as Chapter)
    );
  } catch (error) {
    console.error("Bölümler çekilirken hata oluştu:", error);
    return [];
  }
};

export const fetchLevels = async (chapterId: number): Promise<Level[]> => {
  try {
    const levelsCol = collection(
      db,
      "chapters",
      chapterId.toString(),
      "levels"
    );
    const q = query(levelsCol, orderBy("id", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
        } as Level)
    );
  } catch (error) {
    console.error("Seviyeler çekilirken hata oluştu:", error);
    return [];
  }
};

export const fetchLevelDetails = async (
  chapterId: number,
  levelId: number
): Promise<Level | null> => {
  try {
    const levelDoc = await getDoc(
      doc(db, "chapters", chapterId.toString(), "levels", levelId.toString())
    );
    if (levelDoc.exists()) {
      return levelDoc.data() as Level;
    }
    return null;
  } catch (error) {
    console.error("Seviye detayı çekilirken hata oluştu:", error);
    return null;
  }
};
