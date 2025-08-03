import { FirestoreCreateEndpoint } from "../../lib/firestore-endpoints";
import { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskCreate extends FirestoreCreateEndpoint<HandleArgs> {
  _meta = {
    model: TaskModel,
  };
}
