// controllers/grammarChecker.controller.js
import axios, { HttpStatusCode } from "axios";
import ApiError from "../utils/ApiError.js";

class GrammarCheckerController {
  static async generate(req, res, next) {
    try {
      const { text } = req.body;
      const response = await axios.post("http://localhost:5001/generate", { text });
      res.status(HttpStatusCode.Ok).json(response.data);
    } catch (err) {
      if (err.code === "ECONNREFUSED") {
        throw new ApiError(HttpStatusCode.ServiceUnavailable,"GrammarChecker Service is not available")
      }
      next(err); 
    }
  }
}

export default GrammarCheckerController;
