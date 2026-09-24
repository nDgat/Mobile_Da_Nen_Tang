import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes.js";
import { bookingRouter } from "../modules/bookings/booking.routes.js";
import { cinemaRouter } from "../modules/cinemas/cinema.routes.js";
import { concessionRouter } from "../modules/concessions/concession.routes.js";
import { learningRouter } from "../modules/learning/learning.routes.js";
import { movieRouter } from "../modules/movies/movie.routes.js";
import { roomRouter } from "../modules/rooms/room.routes.js";
import { seatRouter } from "../modules/seats/seat.routes.js";
import { showtimeRouter } from "../modules/showtimes/showtime.routes.js";
import { voucherRouter } from "../modules/vouchers/voucher.routes.js";
import { ticketRouter } from "../modules/tickets/ticket.routes.js";
import { notificationRouter } from "../modules/notifications/notification.routes.js";
import { favoriteRouter } from "../modules/favorites/favorite.routes.js";
import { adminRouter } from "../modules/admin/admin.routes.js";

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
apiRouter.use("/concessions", concessionRouter);
apiRouter.use("/rooms", roomRouter);
apiRouter.use("/seats", seatRouter);
apiRouter.use("/showtimes", showtimeRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/bookings", bookingRouter);
apiRouter.use("/vouchers", voucherRouter);
apiRouter.use("/tickets", ticketRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/favorites", favoriteRouter);
apiRouter.use("/admin", adminRouter);
