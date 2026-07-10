import { IUserDocument } from "../../modules/auth/auth.model.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}
