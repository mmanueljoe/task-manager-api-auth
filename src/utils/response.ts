import { type Response } from "express";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export const success = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  extra?: { total?: number; page?: number; limit?: number }
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  if (message) {
    response.message = message;
  }
  if (extra) {
    if (extra.total !== undefined) response.total = extra.total;
    if (extra.page !== undefined) response.page = extra.page;
    if (extra.limit !== undefined) response.limit = extra.limit;
  }
  res.status(statusCode).json(response);
};

export const error = (
  res: Response,
  message: string,
  statusCode = 500
): void => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};
