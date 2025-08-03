import { FirestoreListEndpoint } from "../../lib/firestore-endpoints";
import { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskList extends FirestoreListEndpoint<HandleArgs> {
  _meta = {
    model: TaskModel,
  };
}
