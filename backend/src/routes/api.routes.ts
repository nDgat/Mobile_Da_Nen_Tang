import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes.js";
import { cinemaRouter } from "../modules/cinemas/cinema.routes.js";
import { learningRouter } from "../modules/learning/learning.routes.js";
import { movieRouter } from "../modules/movies/movie.routes.js";
import { roomRouter } from "../modules/rooms/room.routes.js";
import { seatRouter } from "../modules/seats/seat.routes.js";
import { showtimeRouter } from "../modules/showtimes/showtime.routes.js";

export const apiRouter = Router();

apiRouter.get("/", (_request, response) => {
  response.status(200).json({
    data: {
      name: "CineBook API",
      version: "v1",
    },
  });
});

apiRouter.use("/examples", learningRouter);
apiRouter.use("/movies", movieRouter);
apiRouter.use("/cinemas", cinemaRouter);
apiRouter.use("/rooms", roomRouter);
apiRouter.use("/seats", seatRouter);
apiRouter.use("/showtimes", showtimeRouter);
apiRouter.use("/auth", authRouter);
