import { FirestoreReadEndpoint } from "../../lib/firestore-endpoints";
import { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskRead extends FirestoreReadEndpoint<HandleArgs> {
  _meta = {
    model: TaskModel,
  };
}
