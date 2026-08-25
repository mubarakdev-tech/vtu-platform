import { Request, Response } from "express";
import mongoose from "mongoose";

import Announcement from "../models/announcement.model";

// =====================================================
// HELPER
// =====================================================

const isAnnouncementCurrentlyActive = (
  announcement: any
) => {
  const now = new Date();

  if (!announcement.isActive) {
    return false;
  }

  if (
    announcement.startDate &&
    new Date(announcement.startDate) > now
  ) {
    return false;
  }

  if (
    announcement.endDate &&
    new Date(announcement.endDate) < now
  ) {
    return false;
  }

  return true;
};

// =====================================================
// GET PUBLIC ANNOUNCEMENTS
// =====================================================
//
// GET /api/announcements
//
// Anyone can access this endpoint.
//
// Returns only announcements that are:
// - active
// - within their date range
//
// =====================================================

export const getAnnouncements = async (
  req: Request,
  res: Response
) => {
  try {
    const now = new Date();

    const announcements =
      await Announcement.find({
        isActive: true,

        $and: [
          {
            $or: [
              {
                startDate: null,
              },
              {
                startDate: {
                  $exists: false,
                },
              },
              {
                startDate: {
                  $lte: now,
                },
              },
            ],
          },

          {
            $or: [
              {
                endDate: null,
              },
              {
                endDate: {
                  $exists: false,
                },
              },
              {
                endDate: {
                  $gte: now,
                },
              },
            ],
          },
        ],
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      message:
        "Announcements fetched successfully",
      announcements,
    });
  } catch (error) {
    console.error(
      "GET ANNOUNCEMENTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch announcements.",
    });
  }
};

// =====================================================
// GET ALL ANNOUNCEMENTS - ADMIN
// =====================================================
//
// GET /api/announcements/admin/all
//
// Admin only.
//
// =====================================================

export const getAllAnnouncements = async (
  req: Request,
  res: Response
) => {
  try {
    const announcements =
      await Announcement.find()
        .populate(
          "createdBy",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      message:
        "All announcements fetched successfully",
      announcements,
    });
  } catch (error) {
    console.error(
      "GET ALL ANNOUNCEMENTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch announcements.",
    });
  }
};

// =====================================================
// CREATE ANNOUNCEMENT
// =====================================================
//
// POST /api/announcements
//
// Admin only.
//
// =====================================================

export const createAnnouncement = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      title,
      message,
      type,
      isActive,
      startDate,
      endDate,
    } = req.body;

    // -----------------------------------------------
    // VALIDATE TITLE
    // -----------------------------------------------

    if (
      !title ||
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Announcement title is required.",
      });
    }

    // -----------------------------------------------
    // VALIDATE MESSAGE
    // -----------------------------------------------

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Announcement message is required.",
      });
    }

    // -----------------------------------------------
    // VALIDATE TYPE
    // -----------------------------------------------

    const allowedTypes = [
      "INFO",
      "SUCCESS",
      "WARNING",
      "URGENT",
    ];

    const announcementType =
      type || "INFO";

    if (
      !allowedTypes.includes(
        announcementType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid announcement type.",
      });
    }

    // -----------------------------------------------
    // VALIDATE DATES
    // -----------------------------------------------

    let parsedStartDate:
      | Date
      | null = null;

    let parsedEndDate:
      | Date
      | null = null;

    if (startDate) {
      parsedStartDate =
        new Date(startDate);

      if (
        Number.isNaN(
          parsedStartDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid start date.",
        });
      }
    }

    if (endDate) {
      parsedEndDate =
        new Date(endDate);

      if (
        Number.isNaN(
          parsedEndDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid end date.",
        });
      }
    }

    if (
      parsedStartDate &&
      parsedEndDate &&
      parsedEndDate < parsedStartDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "End date cannot be earlier than start date.",
      });
    }

    // -----------------------------------------------
    // GET ADMIN USER
    // -----------------------------------------------

    const userId =
      (req as any).user?._id ||
      (req as any).user?.id ||
      null;

    // -----------------------------------------------
    // CREATE ANNOUNCEMENT
    // -----------------------------------------------

    const announcement =
      await Announcement.create({
        title: title.trim(),

        message: message.trim(),

        type: announcementType,

        isActive:
          typeof isActive === "boolean"
            ? isActive
            : true,

        startDate:
          parsedStartDate,

        endDate:
          parsedEndDate,

        createdBy:
          userId &&
          mongoose.Types.ObjectId.isValid(
            userId
          )
            ? userId
            : null,
      });

    return res.status(201).json({
      success: true,
      message:
        "Announcement created successfully",
      announcement,
    });
  } catch (error) {
    console.error(
      "CREATE ANNOUNCEMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create announcement.",
    });
  }
};

// =====================================================
// GET SINGLE ANNOUNCEMENT
// =====================================================
//
// GET /api/announcements/:id
//
// Admin only.
//
// =====================================================

export const getAnnouncementById = async (
  req: Request,
  res: Response
) => {
  try {
    // FIX: Express can type params as string | string[]
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (
      !id ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid announcement ID.",
      });
    }

    const announcement =
      await Announcement.findById(id).populate(
        "createdBy",
        "name email role"
      );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message:
          "Announcement not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Announcement fetched successfully",
      announcement,
    });
  } catch (error) {
    console.error(
      "GET ANNOUNCEMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch announcement.",
    });
  }
};

// =====================================================
// UPDATE ANNOUNCEMENT
// =====================================================
//
// PUT /api/announcements/:id
//
// Admin only.
//
// =====================================================

export const updateAnnouncement = async (
  req: Request,
  res: Response
) => {
  try {
    // FIX: Express can type params as string | string[]
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (
      !id ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid announcement ID.",
      });
    }

    const announcement =
      await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message:
          "Announcement not found.",
      });
    }

    const {
      title,
      message,
      type,
      isActive,
      startDate,
      endDate,
    } = req.body;

    // -----------------------------------------------
    // TITLE
    // -----------------------------------------------

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid announcement title.",
        });
      }

      announcement.title =
        title.trim();
    }

    // -----------------------------------------------
    // MESSAGE
    // -----------------------------------------------

    if (message !== undefined) {
      if (
        typeof message !== "string" ||
        !message.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid announcement message.",
        });
      }

      announcement.message =
        message.trim();
    }

    // -----------------------------------------------
    // TYPE
    // -----------------------------------------------

    if (type !== undefined) {
      const allowedTypes = [
        "INFO",
        "SUCCESS",
        "WARNING",
        "URGENT",
      ];

      if (
        !allowedTypes.includes(type)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid announcement type.",
        });
      }

      announcement.type = type;
    }

    // -----------------------------------------------
    // ACTIVE STATUS
    // -----------------------------------------------

    if (isActive !== undefined) {
      if (
        typeof isActive !== "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be true or false.",
        });
      }

      announcement.isActive =
        isActive;
    }

    // -----------------------------------------------
    // START DATE
    // -----------------------------------------------

    if (startDate !== undefined) {
      if (
        startDate === null ||
        startDate === ""
      ) {
        announcement.startDate = null;
      } else {
        const date =
          new Date(startDate);

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid start date.",
          });
        }

        announcement.startDate =
          date;
      }
    }

    // -----------------------------------------------
    // END DATE
    // -----------------------------------------------

    if (endDate !== undefined) {
      if (
        endDate === null ||
        endDate === ""
      ) {
        announcement.endDate = null;
      } else {
        const date =
          new Date(endDate);

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid end date.",
          });
        }

        announcement.endDate = date;
      }
    }

    // -----------------------------------------------
    // DATE VALIDATION
    // -----------------------------------------------

    if (
      announcement.startDate &&
      announcement.endDate &&
      announcement.endDate <
        announcement.startDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "End date cannot be earlier than start date.",
      });
    }

    // -----------------------------------------------
    // SAVE
    // -----------------------------------------------

    await announcement.save();

    return res.status(200).json({
      success: true,
      message:
        "Announcement updated successfully",
      announcement,
    });
  } catch (error) {
    console.error(
      "UPDATE ANNOUNCEMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update announcement.",
    });
  }
};

// =====================================================
// DELETE ANNOUNCEMENT
// =====================================================
//
// DELETE /api/announcements/:id
//
// Admin only.
//
// =====================================================

export const deleteAnnouncement = async (
  req: Request,
  res: Response
) => {
  try {
    // FIX: Express can type params as string | string[]
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (
      !id ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid announcement ID.",
      });
    }

    const announcement =
      await Announcement.findByIdAndDelete(
        id
      );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message:
          "Announcement not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Announcement deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE ANNOUNCEMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete announcement.",
    });
  }
};

// =====================================================
// TOGGLE ANNOUNCEMENT STATUS
// =====================================================
//
// PATCH /api/announcements/:id/status
//
// Body:
// {
//   "isActive": true
// }
//
// Admin only.
//
// =====================================================

export const toggleAnnouncementStatus =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      // FIX: Express can type params as string | string[]
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const { isActive } = req.body;

      if (
        !id ||
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid announcement ID.",
        });
      }

      if (
        typeof isActive !== "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be true or false.",
        });
      }

      const announcement =
        await Announcement.findByIdAndUpdate(
          id,
          {
            isActive,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message:
            "Announcement not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: isActive
          ? "Announcement activated successfully"
          : "Announcement deactivated successfully",
        announcement,
      });
    } catch (error) {
      console.error(
        "TOGGLE ANNOUNCEMENT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update announcement status.",
      });
    }
  };