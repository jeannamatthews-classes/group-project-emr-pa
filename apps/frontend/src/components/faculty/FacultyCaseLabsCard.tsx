import type { ChangeEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { getDisplayName } from "../../services/authApi";
import type { FacultyCaseLab } from "../../services/facultyApi";
import {
  formatSubmissionDate,
  isImageLab,
  LAB_FILE_ACCEPT,
  useFacultyAssetUrl,
} from "./facultySubmissionShared";

type FacultyCaseLabsCardProps = {
  caseHasLabs: boolean;
  labs: FacultyCaseLab[];
  labTitle: string;
  labCategory: string;
  labDescription: string;
  labFile: File | null;
  labVisibleToStudent: boolean;
  uploadingLab: boolean;
  updatingLabId: string | null;
  deletingLabId: string | null;
  labMessage: string | null;
  labError: string | null;
  imageLoadErrors: Record<string, boolean>;
  onLabTitleChange: (value: string) => void;
  onLabCategoryChange: (value: string) => void;
  onLabDescriptionChange: (value: string) => void;
  onLabFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLabVisibleToStudentChange: (checked: boolean) => void;
  onUploadLab: () => void;
  onOpenLab: (lab: FacultyCaseLab) => void;
  onToggleLabVisibility: (lab: FacultyCaseLab) => void;
  onDeleteLab: (lab: FacultyCaseLab) => void;
  onEditLab: (lab: FacultyCaseLab) => void;
  onLabImageError: (labId: string) => void;
};

type FacultyLabImagePreviewProps = {
  lab: FacultyCaseLab;
  hasLoadError: boolean;
  onLabImageError: (labId: string) => void;
};

function FacultyLabImagePreview({
  lab,
  hasLoadError,
  onLabImageError,
}: FacultyLabImagePreviewProps) {
  const { assetUrl, error, loading } = useFacultyAssetUrl(lab.fileUrl);

  if (hasLoadError || error) {
    return (
      <Alert severity="warning">
        This image preview could not be displayed here. Use Open File to view it directly.
      </Alert>
    );
  }

  if (loading || !assetUrl) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={assetUrl}
      alt={lab.title}
      onError={() => onLabImageError(lab.id)}
      sx={{
        width: "100%",
        maxHeight: 320,
        display: "block",
        objectFit: "contain",
        borderRadius: 2,
        border: "1px solid #dbe4f0",
        bgcolor: "#f8fafc",
      }}
    />
  );
}

export default function FacultyCaseLabsCard({
  caseHasLabs,
  labs,
  labTitle,
  labCategory,
  labDescription,
  labFile,
  labVisibleToStudent,
  uploadingLab,
  updatingLabId,
  deletingLabId,
  labMessage,
  labError,
  imageLoadErrors,
  onLabTitleChange,
  onLabCategoryChange,
  onLabDescriptionChange,
  onLabFileChange,
  onLabVisibleToStudentChange,
  onUploadLab,
  onOpenLab,
  onToggleLabVisibility,
  onDeleteLab,
  onEditLab,
  onLabImageError,
}: FacultyCaseLabsCardProps) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Case Labs
        </Typography>

        {labMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {labMessage}
          </Alert>
        )}

        {labError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {labError}
          </Alert>
        )}

        {caseHasLabs ? (
          <>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Create Case Lab
            </Typography>

            <Stack spacing={2} sx={{ mb: 3 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Lab Title"
                  fullWidth
                  value={labTitle}
                  onChange={(event) => onLabTitleChange(event.target.value)}
                  placeholder="CBC Results, Chest X-Ray, CMP Panel..."
                />
                <TextField
                  label="Category"
                  fullWidth
                  value={labCategory}
                  onChange={(event) => onLabCategoryChange(event.target.value)}
                  placeholder="Optional grouping"
                />
              </Stack>

              <TextField
                label="Faculty Note"
                fullWidth
                multiline
                minRows={3}
                value={labDescription}
                onChange={(event) => onLabDescriptionChange(event.target.value)}
                placeholder="Optional instructions for the lab."
              />

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Button component="label" variant="outlined">
                  Choose Lab File
                  <input hidden type="file" accept={LAB_FILE_ACCEPT} onChange={onLabFileChange} />
                </Button>
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  {labFile
                    ? labFile.name
                    : "PDF, image, CSV, TXT, XLS, or XLSX files up to 10 MB."}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={labVisibleToStudent}
                      onChange={(event) => onLabVisibleToStudentChange(event.target.checked)}
                    />
                  }
                  label="Visible to students now"
                />
                <Button
                  variant="contained"
                  sx={{ bgcolor: "#1a3a5c" }}
                  onClick={onUploadLab}
                  disabled={uploadingLab}
                  startIcon={uploadingLab ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  {uploadingLab ? "Uploading..." : "Upload Lab"}
                </Button>
              </Stack>
            </Stack>

            <Divider sx={{ mb: 2 }} />
          </>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            Case with Labs is toggled off. Existing labs can be seen below.
          </Alert>
        )}

        {labs.length === 0 ? (
          caseHasLabs ? (
            <Alert severity="info">
              No labs uploaded yet. You can upload them hidden first, then unhide them when you
              want students to see them.
            </Alert>
          ) : null
        ) : (
          <Stack spacing={2}>
            {labs.map((lab) => (
              <Card key={lab.id} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {lab.title}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1, mb: 1 }}>
                          {lab.category && <Chip label={lab.category} size="small" />}
                          <Chip
                            label={lab.isVisibleToStudent ? "Visible to students" : "Hidden from students"}
                            size="small"
                            color={lab.isVisibleToStudent ? "success" : "warning"}
                          />
                          <Chip label={lab.originalFilename} size="small" variant="outlined" />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Uploaded {formatSubmissionDate(lab.createdAt)}
                          {lab.uploadedByFaculty ? ` by ${getDisplayName(lab.uploadedByFaculty)}` : ""}
                        </Typography>
                        {lab.description && (
                          <Typography sx={{ mt: 1, whiteSpace: "pre-wrap" }}>{lab.description}</Typography>
                        )}
                      </Box>

                      <Stack direction={{ xs: "column", sm: "row", md: "column" }} spacing={1}>
                        <Button
                          variant="outlined"
                          onClick={() => onOpenLab(lab)}
                        >
                          Open File
                        </Button>
                        <Button variant="outlined" onClick={() => onEditLab(lab)}>
                          Edit Lab
                        </Button>
                        <Button
                          variant={lab.isVisibleToStudent ? "outlined" : "contained"}
                          color={lab.isVisibleToStudent ? "warning" : "primary"}
                          onClick={() => onToggleLabVisibility(lab)}
                          disabled={updatingLabId === lab.id}
                          startIcon={
                            updatingLabId === lab.id ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : null
                          }
                        >
                          {updatingLabId === lab.id
                            ? "Updating..."
                            : lab.isVisibleToStudent
                              ? "Hide from students"
                              : "Unhide for students"}
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => onDeleteLab(lab)}
                          disabled={deletingLabId === lab.id}
                          startIcon={
                            deletingLabId === lab.id ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : null
                          }
                        >
                          {deletingLabId === lab.id ? "Deleting..." : "Delete Lab"}
                        </Button>
                      </Stack>
                    </Box>

                    {isImageLab(lab) && (
                      <FacultyLabImagePreview
                        lab={lab}
                        hasLoadError={Boolean(imageLoadErrors[lab.id])}
                        onLabImageError={onLabImageError}
                      />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
