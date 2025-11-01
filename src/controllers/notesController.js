import createHttpError from "http-errors";
import { Note } from "../models/note.js";

export const getAllNotes = async (req, res) => {
  const { page = 1, perPage = 10, tag, search } = req.query;
  const skip = (page - 1) * perPage;

  const filter = { userId: req.user._id };

  // 🔍 Пошук: якщо є текстовий індекс — використовуємо $text
  if (search && search.trim() !== "") {
    const searchTerm = search.trim();

    try {
      // Якщо схема підтримує текстовий індекс
      const hasTextIndex = Note.schema.indexes().some(([fields]) =>
        Object.keys(fields).some((key) => fields[key] === "text")
      );

      if (hasTextIndex) {
        filter.$text = { $search: searchTerm };
      } else {
        // fallback: regex пошук
        const safeSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(safeSearch, "i");
        filter.$or = [{ title: regex }, { content: regex }];
      }
    } catch {
      // fallback на regex у разі помилки
      const safeSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safeSearch, "i");
      filter.$or = [{ title: regex }, { content: regex }];
    }
  }

  if (tag) {
    filter.tag = tag;
  }

  const [totalNotes, notes] = await Promise.all([
    Note.countDocuments(filter),
    Note.find(filter).skip(skip).limit(Number(perPage)),
  ]);

  const totalPages = Math.ceil(totalNotes / perPage);

  res.status(200).json({
    page: Number(page),
    perPage: Number(perPage),
    totalNotes,
    totalPages,
    notes,
  });
};

export const getNoteById = async (req, res, next) => {
  const { noteId } = req.params;

  const note = await Note.findOne({
    _id: noteId,
    userId: req.user._id,
  });

  if (!note) {
    next(createHttpError(404, "Note not found"));
    return;
  }

  res.status(200).json(note);
};

export const createNote = async (req, res) => {
  const note = await Note.create({
    ...req.body,
    userId: req.user._id,
  });

  res.status(201).json(note);
};

export const deleteNote = async (req, res, next) => {
  const { noteId } = req.params;

  const note = await Note.findOneAndDelete({
    _id: noteId,
    userId: req.user._id,
  });

  if (!note) {
    next(createHttpError(404, "Note not found"));
    return;
  }

  res.status(200).json(note);
};

export const updateNote = async (req, res, next) => {
  const { noteId } = req.params;

  const note = await Note.findOneAndUpdate(
    { _id: noteId, userId: req.user._id },
    req.body,
    { new: true }
  );

  if (!note) {
    next(createHttpError(404, "Note not found"));
    return;
  }

  res.status(200).json(note);
};
