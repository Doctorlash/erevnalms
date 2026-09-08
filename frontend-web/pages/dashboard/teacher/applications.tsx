import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import TeacherLayout from "../../../layouts/TeacherLayout";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";

type Programme = "JAMB" | "WAEC";
type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Subject {
  id: string;
  name: string;
  description?: string | null;
  programme: Programme;
  isActive: boolean;
  teacherId?: string | null;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface TeacherApplication {
  id: string;
  subjectId: string;
  programme: Programme;
  status: ApplicationStatus;
  rejectionReason?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;
  subject: Subject;
}

interface ApiErrorResponse {
  message?: string | string[];
}

export default function TeacherApplicationsPage() {
  const { user } = useAuth();

  const [programme, setProgramme] = useState<Programme>("JAMB");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [applications, setApplications] = useState<TeacherApplication[]>([]);

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(false);

  const [applyingSubjectId, setApplyingSubjectId] = useState<string | null>(
    null,
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const applicationMap = useMemo(() => {
    const map = new Map<string, TeacherApplication>();

    applications.forEach((application) => {
      map.set(`${application.subjectId}-${application.programme}`, application);
    });

    return map;
  }, [applications]);

  const getErrorMessage = (err: unknown): string => {
    const axiosError = err as AxiosError<ApiErrorResponse>;

    const message = axiosError.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string") {
      return message;
    }

    return "Something went wrong. Please try again.";
  };

  const loadApplications = async () => {
    try {
      setLoadingApplications(true);

      const response = await api.get("/teacher-applications/my-applications");

      setApplications(response.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingApplications(false);
    }
  };

  const loadSubjects = async (selectedProgramme: Programme) => {
    try {
      setLoadingSubjects(true);
      setError("");

      const response = await api.get(
        `/subjects/available-for-teacher?programme=${selectedProgramme}`,
      );

      setSubjects(response.data || []);
    } catch (err) {
      setSubjects([]);
      setError(getErrorMessage(err));
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    loadApplications();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    loadSubjects(programme);
  }, [user, programme]);

  const handleApply = async (subject: Subject) => {
    try {
      setApplyingSubjectId(subject.id);
      setError("");
      setSuccess("");

      await api.post("/teacher-applications", {
        subjectId: subject.id,
        programme: subject.programme,
      });

      setSuccess(`Application submitted for ${subject.name}.`);

      await loadApplications();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setApplyingSubjectId(null);
    }
  };

  const getApplication = (subject: Subject) => {
    return applicationMap.get(`${subject.id}-${subject.programme}`);
  };

  const renderApplicationStatus = (application?: TeacherApplication) => {
    if (!application) {
      return null;
    }

    if (application.status === "PENDING") {
      return (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <p className="text-sm font-semibold text-yellow-800">
            Application Pending
          </p>
          <p className="mt-1 text-xs text-yellow-700">
            Your application is waiting for administrator review.
          </p>
        </div>
      );
    }

    if (application.status === "APPROVED") {
      return (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-semibold text-green-800">
            Application Approved
          </p>
          <p className="mt-1 text-xs text-green-700">
            You are now assigned to this subject.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-sm font-semibold text-red-800">
          Application Rejected
        </p>

        {application.rejectionReason && (
          <p className="mt-1 text-sm text-red-700">
            <span className="font-medium">Reason:</span>{" "}
            {application.rejectionReason}
          </p>
        )}

        <button
          type="button"
          onClick={() =>
            handleApply(
              subjects.find(
                (subject) => subject.id === application.subjectId,
              ) as Subject,
            )
          }
          disabled={applyingSubjectId === application.subjectId}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {applyingSubjectId === application.subjectId
            ? "Resubmitting..."
            : "Resubmit Application"}
        </button>
      </div>
    );
  };

  return (
    <TeacherLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Subject Applications
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Apply to teach JAMB or WAEC subjects. Your application will be
            reviewed by an administrator before you are assigned to the subject.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setProgramme("JAMB");
              setError("");
              setSuccess("");
            }}
            className={`rounded-lg px-6 py-3 text-sm font-semibold transition ${
              programme === "JAMB"
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            JAMB Subjects
          </button>

          <button
            type="button"
            onClick={() => {
              setProgramme("WAEC");
              setError("");
              setSuccess("");
            }}
            className={`rounded-lg px-6 py-3 text-sm font-semibold transition ${
              programme === "WAEC"
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            WAEC Subjects
          </button>
        </div>

        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {programme} Subject Catalogue
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select a subject you would like to teach.
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {subjects.length} subject{subjects.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {loadingSubjects || loadingApplications ? (
          <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
              <p className="mt-4 text-sm text-gray-500">Loading subjects...</p>
            </div>
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              No subjects available
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              There are currently no active {programme} subjects available for
              application.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((subject) => {
              const application = getApplication(subject);
              const assignedToAnotherTeacher =
                Boolean(subject.teacherId) && subject.teacherId !== user?.id;

              const assignedToCurrentTeacher = subject.teacherId === user?.id;

              return (
                <div
                  key={subject.id}
                  className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {subject.name}
                      </h3>

                      <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {subject.programme}
                      </span>
                    </div>

                    {assignedToCurrentTeacher && (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        Assigned
                      </span>
                    )}

                    {assignedToAnotherTeacher && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                        Assigned
                      </span>
                    )}
                  </div>

                  {subject.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">
                      {subject.description}
                    </p>
                  )}

                  <div className="mt-auto pt-5">
                    {assignedToCurrentTeacher ? (
                      <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                        You are currently assigned to this subject.
                      </div>
                    ) : assignedToAnotherTeacher ? (
                      <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                        This subject is currently assigned to another teacher.
                      </div>
                    ) : application ? (
                      renderApplicationStatus(application)
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApply(subject)}
                        disabled={applyingSubjectId === subject.id}
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {applyingSubjectId === subject.id
                          ? "Submitting..."
                          : "Apply to Teach"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="font-semibold text-blue-900">
            How subject applications work
          </h3>

          <ol className="mt-3 space-y-2 text-sm text-blue-800">
            <li>1. Select JAMB or WAEC.</li>
            <li>2. Choose an available subject.</li>
            <li>3. Submit your application.</li>
            <li>4. An administrator reviews your application.</li>
            <li>
              5. If approved, the subject is assigned to you and becomes part of
              your teaching workload.
            </li>
            <li>
              6. If rejected, you can review the reason and resubmit your
              application.
            </li>
          </ol>
        </div>
      </div>
    </TeacherLayout>
  );
}
