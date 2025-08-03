import { FirestoreDeleteEndpoint } from "../../lib/firestore-endpoints";
import { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskDelete extends FirestoreDeleteEndpoint<HandleArgs> {
  _meta = {
    model: TaskModel,
  };
}
