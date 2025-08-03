import { Context } from "hono";
import { getDb } from "../../lib/firestore";
import { HandleArgs } from "../../types";

export const TaskList = async (c: Context<HandleArgs>) => {
  try {
    const db = getDb(c.env);
    const querySnapshot = await db.collection("tasks").get();

    const tasks: any[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return c.json(tasks);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
