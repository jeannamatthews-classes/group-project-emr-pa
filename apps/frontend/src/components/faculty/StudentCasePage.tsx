import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, CircularProgress, Stack } from "@mui/material";

import { getMe, getStoredToken, logout, openAuthenticatedAsset } from "../../services/authApi";
import {
  facultyDeleteCaseLab,
  facultyGetCase,
  facultyListCaseLabs,
  facultyListCaseNotes,
  facultySaveNoteFeedback,
  facultySetCaseLabVisibility,
  facultyUpdateCaseLab,
  facultyUploadCaseLab,
  type FacultyCaseDetail,
  type FacultyCaseLab,
  type FacultyCaseNote,
} from "../../services/facultyApi";
import FacultyCaseLabsCard from "./FacultyCaseLabsCard";
import FacultyCaseSummaryCard from "./FacultyCaseSummaryCard";
import FacultyFeedbackCard from "./FacultyFeedbackCard";
import FacultyLabEditDialog from "./FacultyLabEditDialog";
import FacultyNoteSections from "./FacultyNoteSections";
import FacultyPageTopBar from "./FacultyPageTopBar";
import FacultySubmissionTimelineCard from "./FacultySubmissionTimelineCard";
import { type LabEditFormState } from "./facultySubmissionShared";

export default function StudentCasePage() {
  const { caseId, studentId } = useParams<{ caseId: string; studentId: string }>();
  const navigate = useNavigate();

  const [caseDetail, setCaseDetail] = useState<FacultyCaseDetail | null>(null);
  const [note, setNote] = useState<FacultyCaseNote | null>(null);
  const [draftExists, setDraftExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [grade, setGrade] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [labs, setLabs] = useState<FacultyCaseLab[]>([]);
  const [labTitle, setLabTitle] = useState("");
  const [labCategory, setLabCategory] = useState("");
  const [labDescription, setLabDescription] = useState("");
  const [labFile, setLabFile] = useState<File | null>(null);
  const [labVisibleToStudent, setLabVisibleToStudent] = useState(false);
  const [uploadingLab, setUploadingLab] = useState(false);
  const [updatingLabId, setUpdatingLabId] = useState<string | null>(null);
  const [deletingLabId, setDeletingLabId] = useState<string | null>(null);
  const [editingLab, setEditingLab] = useState<FacultyCaseLab | null>(null);
  const [editLabForm, setEditLabForm] = useState<LabEditFormState>({
    title: "",
    category: "",
    description: "",
    isVisibleToStudent: false,
  });
  const [editLabFile, setEditLabFile] = useState<File | null>(null);
  const [savingLabEdit, setSavingLabEdit] = useState(false);
  const [labMessage, setLabMessage] = useState<string | null>(null);
  const [labError, setLabError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;

    async function loadSubmission() {
      if (!caseId || !studentId) {
        if (active) {
          setLoading(false);
          setError("Missing student or case id.");
        }
        return;
      }

      const token = getStoredToken();
      if (!token) {
        if (active) {
          setLoading(false);
          setError("You are not logged in.");
        }
        return;
      }

      try {
        const numericCaseId = Number(caseId);
        const [{ case: nextCase }, { notes }, { labs: nextLabs }, me] = await Promise.all([
          facultyGetCase(token, numericCaseId),
          facultyListCaseNotes(token, numericCaseId),
          facultyListCaseLabs(token, numericCaseId),
          getMe(token),
        ]);

        if (!active) return;

        const matchingNote = notes.find((item) => item.studentId === studentId) ?? null;
        const matchingAssignment = nextCase.assignments.find((item) => item.studentId === studentId);
        const matchingDraftSummary =
          nextCase.notes.find((item) => item.studentId === studentId && !item.isSubmitted) ?? null;

        if (!matchingNote && !matchingAssignment) {
          setError("This student is not assigned to the selected case.");
          setCaseDetail(nextCase);
          setNote(null);
          setDraftExists(false);
          return;
        }

        setCaseDetail(nextCase);
        setNote(matchingNote);
        setDraftExists(Boolean(matchingDraftSummary));
        setLabs(nextLabs);
        setImageLoadErrors({});
        setIsAdmin(me.user.role === "admin");
        setFeedback(matchingNote?.feedback ?? "");
        setGrade(
          matchingNote?.grade !== null && matchingNote?.grade !== undefined
            ? String(matchingNote.grade)
            : ""
        );
        setSaveMessage(null);
        setSaveError(null);
        setLabMessage(null);
        setLabError(null);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load submission.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSubmission();
    return () => {
      active = false;
    };
  }, [caseId, studentId]);

  const assignedStudent =
    note?.student ??
    caseDetail?.assignments.find((assignment) => assignment.studentId === studentId)?.student ??
    null;
  const patientName = caseDetail?.patientName ?? caseDetail?.patient ?? "";
  const chiefComplaint = caseDetail?.caseTitle ?? caseDetail?.name ?? "";

  async function handleSaveFeedback() {
    if (!note) {
      setSaveError("There is no student note to review yet.");
      return;
    }

    if (!note.isSubmitted) {
      setSaveError("The student must submit the note before you can leave feedback.");
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setSaveError("You are not logged in.");
      return;
    }

    const trimmedFeedback = feedback.trim();
    const parsedGrade = grade.trim() ? Number(grade) : null;

    if (!trimmedFeedback && parsedGrade === null) {
      setSaveError("Enter feedback, a grade, or both before saving.");
      return;
    }

    try {
      setSavingFeedback(true);
      setSaveMessage(null);
      setSaveError(null);
      const { note: updated } = await facultySaveNoteFeedback(token, note.id, {
        feedback: trimmedFeedback || undefined,
        grade: parsedGrade,
      });
      setNote(updated);
      setFeedback(updated.feedback ?? "");
      setGrade(updated.grade !== null ? String(updated.grade) : "");
      setSaveMessage("Feedback saved successfully.");
    } catch (saveFailure) {
      setSaveError(saveFailure instanceof Error ? saveFailure.message : "Failed to save feedback.");
    } finally {
      setSavingFeedback(false);
    }
  }

  function handleLabFileChange(event: ChangeEvent<HTMLInputElement>) {
    setLabFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  function handleEditLabFileChange(event: ChangeEvent<HTMLInputElement>) {
    setEditLabFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  async function handleUploadLab() {
    if (!caseDetail) {
      setLabError("Case details are unavailable.");
      return;
    }

    if (!labFile) {
      setLabError("Choose a lab file before uploading.");
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setLabError("You are not logged in.");
      return;
    }

    const title = labTitle.trim() || labFile.name.replace(/\.[^.]+$/, "");

    try {
      setUploadingLab(true);
      setLabError(null);
      setLabMessage(null);
      const { lab } = await facultyUploadCaseLab(token, caseDetail.id, {
        title,
        category: labCategory.trim() || undefined,
        description: labDescription.trim() || undefined,
        isVisibleToStudent: labVisibleToStudent,
        file: labFile,
      });

      setLabs((current) => [...current, lab]);
      setImageLoadErrors((current) => {
        const next = { ...current };
        delete next[lab.id];
        return next;
      });
      setCaseDetail((current) => (current ? { ...current, hasLabs: true } : current));
      setLabTitle("");
      setLabCategory("");
      setLabDescription("");
      setLabFile(null);
      setLabVisibleToStudent(false);
      setLabMessage(
        lab.isVisibleToStudent
          ? "Lab uploaded and released to students."
          : "Lab uploaded and kept hidden from students."
      );
    } catch (uploadFailure) {
      setLabError(uploadFailure instanceof Error ? uploadFailure.message : "Failed to upload lab.");
    } finally {
      setUploadingLab(false);
    }
  }

  async function handleToggleLabVisibility(lab: FacultyCaseLab) {
    if (!caseDetail) {
      setLabError("Case details are unavailable.");
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setLabError("You are not logged in.");
      return;
    }

    try {
      setUpdatingLabId(lab.id);
      setLabError(null);
      setLabMessage(null);
      const { lab: updatedLab } = await facultySetCaseLabVisibility(
        token,
        caseDetail.id,
        lab.id,
        !lab.isVisibleToStudent
      );

      setLabs((current) => current.map((item) => (item.id === updatedLab.id ? updatedLab : item)));
      setLabMessage(
        updatedLab.isVisibleToStudent
          ? `"${updatedLab.title}" is now visible to students.`
          : `"${updatedLab.title}" is now hidden from students.`
      );
    } catch (updateFailure) {
      setLabError(
        updateFailure instanceof Error ? updateFailure.message : "Failed to update lab visibility."
      );
    } finally {
      setUpdatingLabId(null);
    }
  }

  async function handleDeleteLab(lab: FacultyCaseLab) {
    if (!caseDetail) {
      setLabError("Case details are unavailable.");
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setLabError("You are not logged in.");
      return;
    }

    try {
      setDeletingLabId(lab.id);
      setLabError(null);
      setLabMessage(null);
      await facultyDeleteCaseLab(token, caseDetail.id, lab.id);

      setLabs((current) => {
        const next = current.filter((item) => item.id !== lab.id);
        setCaseDetail((existing) =>
          existing
            ? {
                ...existing,
                hasLabs: next.length > 0,
              }
            : existing
        );
        return next;
      });
      setImageLoadErrors((current) => {
        const next = { ...current };
        delete next[lab.id];
        return next;
      });
      setLabMessage(`Deleted "${lab.title}".`);
    } catch (deleteFailure) {
      setLabError(deleteFailure instanceof Error ? deleteFailure.message : "Failed to delete lab.");
    } finally {
      setDeletingLabId(null);
    }
  }

  function openEditLabDialog(lab: FacultyCaseLab) {
    setEditingLab(lab);
    setEditLabForm({
      title: lab.title,
      category: lab.category ?? "",
      description: lab.description ?? "",
      isVisibleToStudent: lab.isVisibleToStudent,
    });
    setEditLabFile(null);
    setLabError(null);
    setLabMessage(null);
  }

  function closeEditLabDialog(force = false) {
    if (savingLabEdit && !force) {
      return;
    }

    setEditingLab(null);
    setEditLabFile(null);
    setEditLabForm({
      title: "",
      category: "",
      description: "",
      isVisibleToStudent: false,
    });
  }

  async function handleSaveLabEdit() {
    if (!caseDetail || !editingLab) {
      setLabError("Lab details are unavailable.");
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setLabError("You are not logged in.");
      return;
    }

    if (!editLabForm.title.trim() && !editLabFile) {
      setLabError("Lab title is required.");
      return;
    }

    try {
      setSavingLabEdit(true);
      setLabError(null);
      setLabMessage(null);

      const { lab: updatedLab } = await facultyUpdateCaseLab(token, caseDetail.id, editingLab.id, {
        title: editLabForm.title.trim(),
        category: editLabForm.category,
        description: editLabForm.description,
        isVisibleToStudent: editLabForm.isVisibleToStudent,
        file: editLabFile,
      });

      setLabs((current) => current.map((item) => (item.id === updatedLab.id ? updatedLab : item)));
      setImageLoadErrors((current) => {
        const next = { ...current };
        delete next[updatedLab.id];
        return next;
      });
      setLabMessage(`Updated "${updatedLab.title}".`);
      closeEditLabDialog(true);
    } catch (editFailure) {
      setLabError(editFailure instanceof Error ? editFailure.message : "Failed to update lab.");
    } finally {
      setSavingLabEdit(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleLabImageError(labId: string) {
    setImageLoadErrors((current) => ({ ...current, [labId]: true }));
  }

  async function handleOpenLab(lab: FacultyCaseLab) {
    try {
      setLabError(null);
      await openAuthenticatedAsset(lab.fileUrl);
    } catch (error) {
      setLabError(error instanceof Error ? error.message : "Failed to open lab file.");
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f7fb" }}>
      <FacultyPageTopBar
        title="Submission Review"
        isAdmin={isAdmin}
        secondaryActionLabel="Back"
        onTitleClick={() => navigate("/faculty")}
        onGoAdmin={() => navigate("/admin/users")}
        onSecondaryAction={() => navigate(`/student/${studentId}`)}
        onGoSettings={() => navigate("/settings")}
        onLogout={handleLogout}
      />

      <Box sx={{ maxWidth: 1100, mx: "auto", pt: { xs: "88px", sm: "96px" }, px: 3, pb: 4 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !caseDetail ? (
          <Alert severity="warning">Case details are unavailable.</Alert>
        ) : (
          <Stack spacing={3}>
            <FacultyCaseSummaryCard
              caseDetail={caseDetail}
              note={note}
              draftExists={draftExists}
              assignedStudent={assignedStudent}
              studentId={studentId}
              patientName={patientName}
              chiefComplaint={chiefComplaint}
            />

            <FacultyCaseLabsCard
              labs={labs}
              labTitle={labTitle}
              labCategory={labCategory}
              labDescription={labDescription}
              labFile={labFile}
              labVisibleToStudent={labVisibleToStudent}
              uploadingLab={uploadingLab}
              updatingLabId={updatingLabId}
              deletingLabId={deletingLabId}
              labMessage={labMessage}
              labError={labError}
              imageLoadErrors={imageLoadErrors}
              onLabTitleChange={setLabTitle}
              onLabCategoryChange={setLabCategory}
              onLabDescriptionChange={setLabDescription}
              onLabFileChange={handleLabFileChange}
              onLabVisibleToStudentChange={setLabVisibleToStudent}
              onUploadLab={() => void handleUploadLab()}
              onOpenLab={(lab) => void handleOpenLab(lab)}
              onToggleLabVisibility={(lab) => void handleToggleLabVisibility(lab)}
              onDeleteLab={(lab) => void handleDeleteLab(lab)}
              onEditLab={openEditLabDialog}
              onLabImageError={handleLabImageError}
            />

            {!note && !draftExists ? (
              <Alert severity="info">
                This student has not started a note for the selected case yet.
              </Alert>
            ) : !note && draftExists ? (
              <Alert severity="warning">
                This student has a saved draft for this case.
              </Alert>
            ) : note ? (
              <>
                <FacultySubmissionTimelineCard note={note} />
                <FacultyNoteSections note={note} />
                <FacultyFeedbackCard
                  note={note}
                  grade={grade}
                  feedback={feedback}
                  saveMessage={saveMessage}
                  saveError={saveError}
                  savingFeedback={savingFeedback}
                  onGradeChange={setGrade}
                  onFeedbackChange={setFeedback}
                  onSave={() => void handleSaveFeedback()}
                />
              </>
            ) : null}
          </Stack>
        )}
      </Box>

      <FacultyLabEditDialog
        open={editingLab !== null}
        editingLab={editingLab}
        editLabForm={editLabForm}
        editLabFile={editLabFile}
        savingLabEdit={savingLabEdit}
        onClose={() => closeEditLabDialog()}
        onSave={() => void handleSaveLabEdit()}
        onEditLabFormChange={setEditLabForm}
        onEditLabFileChange={handleEditLabFileChange}
      />
    </Box>
  );
}
