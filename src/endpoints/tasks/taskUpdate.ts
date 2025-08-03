import { FirestoreUpdateEndpoint } from "../../lib/firestore-endpoints";
import { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskUpdate extends FirestoreUpdateEndpoint<HandleArgs> {
  _meta = {
    model: TaskModel,
  };
}
