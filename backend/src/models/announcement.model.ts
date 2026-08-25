import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

// =====================================================
// ANNOUNCEMENT INTERFACE
// =====================================================

export interface IAnnouncement
  extends Document {
  title: string;

  message: string;

  type:
    | "INFO"
    | "SUCCESS"
    | "WARNING"
    | "URGENT";

  isActive: boolean;

  startDate?: Date | null;

  endDate?: Date | null;

  createdBy?: mongoose.Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

// =====================================================
// ANNOUNCEMENT SCHEMA
// =====================================================

const announcementSchema =
  new Schema<IAnnouncement>(
    {
      // -----------------------------------------------
      // TITLE
      // -----------------------------------------------

      title: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 150,
      },

      // -----------------------------------------------
      // MESSAGE
      // -----------------------------------------------

      message: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 2000,
      },

      // -----------------------------------------------
      // TYPE
      // -----------------------------------------------

      type: {
        type: String,
        enum: [
          "INFO",
          "SUCCESS",
          "WARNING",
          "URGENT",
        ],
        default: "INFO",
      },

      // -----------------------------------------------
      // ACTIVE STATUS
      // -----------------------------------------------

      isActive: {
        type: Boolean,
        default: true,
      },

      // -----------------------------------------------
      // START DATE
      // -----------------------------------------------

      startDate: {
        type: Date,
        default: null,
      },

      // -----------------------------------------------
      // END DATE
      // -----------------------------------------------

      endDate: {
        type: Date,
        default: null,
      },

      // -----------------------------------------------
      // CREATED BY
      // -----------------------------------------------

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    {
      timestamps: true,
    }
  );

// =====================================================
// INDEXES
// =====================================================

announcementSchema.index({
  isActive: 1,
});

announcementSchema.index({
  createdAt: -1,
});

announcementSchema.index({
  startDate: 1,
  endDate: 1,
});

// =====================================================
// MODEL
// =====================================================

const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>(
    "Announcement",
    announcementSchema
  );

export default Announcement;
