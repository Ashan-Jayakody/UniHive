import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8000/api/resources";
const CATEGORIES = ["Notes", "Videos", "Research Papers", "Links"];

const getCurrentUser = () => {
  try {
    const savedUser = localStorage.getItem("user");
    if (savedUser) return JSON.parse(savedUser);

    const token = localStorage.getItem("token");
    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      _id: payload.id || payload._id || "",
      name: payload.name || "User",
      email: payload.email || "",
      role: payload.role || "",
      status: payload.status || "active",
    };
  } catch {
    return null;
  }
};

const statusBadgeClass = (status) => {
  if (status === "approved") return "bg-green-100 text-green-700 border-green-200";
  if (status === "rejected") return "bg-red-100 text-red-700 border-red-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
};

const isAllowedNotesFileType = (mimeType = "") => {
  const value = String(mimeType).toLowerCase().trim();
  return value === "image/png" || value === "application/pdf";
};

const isLikelyNotesFileUrl = (url = "") => {
  const value = String(url).trim().toLowerCase();
  if (!value) return false;
  return /\.(png|pdf)(\?.*)?$/i.test(value);
};

const ResourceShare = () => {
  const user = useMemo(() => getCurrentUser(), []);
  const token = localStorage.getItem("token") || "";
  const isStudent = user?.role === "student";
  const isModerator = user?.role === "faculty" || user?.role === "admin";

  const [tab, setTab] = useState("browse");
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [browseFilters, setBrowseFilters] = useState({
    category: "",
    subject: "",
    module: "",
    uploadDate: "",
    approvalStatus: "",
    page: 1,
    limit: 8,
    sortBy: "createdAt",
    order: "desc",
  });

  const [browseResources, setBrowseResources] = useState([]);
  const [browsePagination, setBrowsePagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
  });

  const [myResources, setMyResources] = useState([]);
  const [pendingResources, setPendingResources] = useState([]);

  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "Notes",
    subject: "",
    module: "",
    linkUrl: "",
    fileUrl: "",
    file: null,
  });

  const [editDrafts, setEditDrafts] = useState({});
  const [rejectReasons, setRejectReasons] = useState({});

  const resetAlerts = () => {
    setError("");
    setSuccess("");
  };

  const authHeaders = (json = false) => {
    const headers = { Authorization: "Bearer " + token };
    if (json) headers["Content-Type"] = "application/json";
    return headers;
  };

  const parseApiResponse = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await res.json();
    }
    const text = await res.text();
    return { message: text || "Request failed with status " + res.status };
  };

  const normalizeUrl = (raw) => {
    const value = (raw || "").trim();
    if (!value) return "";

    if (value.startsWith("uploaded://")) {
      const fileName = value.replace("uploaded://", "");
      return "http://localhost:8000/uploads/resources/" + encodeURIComponent(fileName);
    }

    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }

    return "https://" + value;
  };

  const openResourceInNewTab = (resource) => {
    const raw = (resource?.linkUrl || resource?.fileUrl || "").trim();
    const finalUrl = normalizeUrl(raw);

    if (!finalUrl) {
      setError("No video source found.");
      return;
    }

    window.open(finalUrl, "_blank", "noopener,noreferrer");
  };

  const toQueryString = (obj) => {
    const params = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        params.append(k, String(v));
      }
    });
    return params.toString();
  };

  const fetchBrowseResources = async (filters = browseFilters) => {
    try {
      setLoading(true);
      resetAlerts();

      const qs = toQueryString(filters);
      const res = await fetch(API_BASE + "?" + qs, {
        headers: authHeaders(false),
      });
      const data = await parseApiResponse(res);

      if (!res.ok) throw new Error(data.message || "Failed to fetch resources");

      setBrowseResources(Array.isArray(data.data) ? data.data : []);
      setBrowsePagination(
        data.pagination || { page: 1, limit: 8, total: 0, totalPages: 1 }
      );
    } catch (err) {
      setError(err.message || "Failed to fetch resources");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyResources = async () => {
    if (!isStudent) return;
    try {
      setLoading(true);
      resetAlerts();

      const res = await fetch(API_BASE + "/mine?page=1&limit=30", {
        headers: authHeaders(false),
      });
      const data = await parseApiResponse(res);

      if (!res.ok) throw new Error(data.message || "Failed to fetch your resources");

      setMyResources(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch your resources");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingResources = async () => {
    if (!isModerator) return;
    try {
      setLoading(true);
      resetAlerts();

      const res = await fetch(API_BASE + "/pending?page=1&limit=30", {
        headers: authHeaders(false),
      });
      const data = await parseApiResponse(res);

      if (!res.ok) throw new Error(data.message || "Failed to fetch pending resources");

      setPendingResources(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch pending resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrowseResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "mine") fetchMyResources();
    if (tab === "moderation") fetchPendingResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const applyBrowseFilters = () => {
    const next = { ...browseFilters, page: 1 };
    setBrowseFilters(next);
    fetchBrowseResources(next);
  };

  const resetBrowseFilters = () => {
    const next = {
      category: "",
      subject: "",
      module: "",
      uploadDate: "",
      approvalStatus: "",
      page: 1,
      limit: 8,
      sortBy: "createdAt",
      order: "desc",
    };
    setBrowseFilters(next);
    fetchBrowseResources(next);
  };

  const goToBrowsePage = (nextPage) => {
    const next = { ...browseFilters, page: nextPage };
    setBrowseFilters(next);
    fetchBrowseResources(next);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    resetAlerts();

    if (!isStudent) {
      setError("Only students can upload resources.");
      return;
    }

    if (!uploadForm.title.trim() || !uploadForm.subject.trim() || !uploadForm.category) {
      setError("Title, category, and subject are required.");
      return;
    }
    if (uploadForm.file && uploadForm.file.size > 100 * 1024 * 1024) {
      setError("File too large. Max size is 100MB.");
      return;
    }

    if (
      uploadForm.category === "Videos" &&
      uploadForm.file &&
      !String(uploadForm.file.type || "").toLowerCase().startsWith("video/")
    ) {
      setError("For Videos category, only video files are allowed.");
      return;
    }

    if (
      uploadForm.category === "Notes" &&
      uploadForm.file &&
      !isAllowedNotesFileType(uploadForm.file.type)
    ) {
      setError("For Notes category, only PNG or PDF files are allowed.");
      return;
    }

    if (uploadForm.category === "Notes") {
      const trimmedLinkUrl = uploadForm.linkUrl.trim();
      const trimmedFileUrl = uploadForm.fileUrl.trim();

      if (trimmedLinkUrl && !isLikelyNotesFileUrl(trimmedLinkUrl)) {
        setError("For Notes category, link URL must end with .png or .pdf.");
        return;
      }

      if (!uploadForm.file && trimmedFileUrl && !isLikelyNotesFileUrl(trimmedFileUrl)) {
        setError("For Notes category, direct file URL must end with .png or .pdf.");
        return;
      }
    }

    if (
      uploadForm.category === "Research Papers" &&
      uploadForm.file &&
      String(uploadForm.file.type || "").toLowerCase().startsWith("video/")
    ) {
      setError("For Research Papers category, video files are not allowed.");
      return;
    }

    if (uploadForm.category === "Research Papers") {
      const trimmedLinkUrl = uploadForm.linkUrl.trim();
      const trimmedFileUrl = uploadForm.fileUrl.trim();

      if (trimmedLinkUrl && /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|\.(mp4|webm|ogg|mov|m4v|avi|mkv)(\?.*)?$/i.test(trimmedLinkUrl)) {
        setError("For Research Papers category, video links are not allowed.");
        return;
      }

      if (!uploadForm.file && trimmedFileUrl && /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|\.(mp4|webm|ogg|mov|m4v|avi|mkv)(\?.*)?$/i.test(trimmedFileUrl)) {
        setError("For Research Papers category, video URLs are not allowed.");
        return;
      }
    }

    if (!uploadForm.file && !uploadForm.fileUrl.trim() && !uploadForm.linkUrl.trim()) {
      setError("Provide at least one: file upload, fileUrl, or linkUrl.");
      return;
    }

    if (uploadForm.category === "Links") {
      if (uploadForm.file || uploadForm.fileUrl.trim()) {
        setError(`For ${uploadForm.category} category, only Link URL is allowed. File upload/file URL is not allowed.`);
        return;
      }

      if (!uploadForm.linkUrl.trim()) {
        setError(`For ${uploadForm.category} category, Link URL is required.`);
        return;
      }
    }

    try {
      setActionLoadingId("upload");

      let res;
      if (uploadForm.file) {
        const body = new FormData();
        body.append("title", uploadForm.title.trim());
        body.append("description", uploadForm.description.trim());
        body.append("category", uploadForm.category);
        body.append("subject", uploadForm.subject.trim());
        body.append("module", uploadForm.module.trim());
        body.append("linkUrl", uploadForm.linkUrl.trim());
        body.append("fileUrl", uploadForm.fileUrl.trim());
        body.append("resourceFile", uploadForm.file);

        res = await fetch(API_BASE, {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
          body,
        });
      } else {
        res = await fetch(API_BASE, {
          method: "POST",
          headers: authHeaders(true),
          body: JSON.stringify({
            title: uploadForm.title.trim(),
            description: uploadForm.description.trim(),
            category: uploadForm.category,
            subject: uploadForm.subject.trim(),
            module: uploadForm.module.trim(),
            linkUrl: uploadForm.linkUrl.trim(),
            fileUrl: uploadForm.fileUrl.trim(),
          }),
        });
      }

      const data = await parseApiResponse(res);
      if (!res.ok) throw new Error(data.message || "Upload failed");

      setSuccess("Resource submitted for review.");
      setUploadForm({
        title: "",
        description: "",
        category: "Notes",
        subject: "",
        module: "",
        linkUrl: "",
        fileUrl: "",
        file: null,
      });

      await fetchMyResources();
      await fetchBrowseResources();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setActionLoadingId("");
    }
  };

  const startEdit = (resource) => {
    setEditDrafts((prev) => ({
      ...prev,
      [resource._id]: {
        title: resource.title || "",
        description: resource.description || "",
        category: resource.category || "Notes",
        subject: resource.subject || "",
        module: resource.module || "",
        linkUrl: resource.linkUrl || "",
        fileUrl: resource.fileUrl || "",
      },
    }));
  };

  const cancelEdit = (id) => {
    setEditDrafts((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const saveEdit = async (id) => {
    const draft = editDrafts[id];
    if (!draft) return;
    resetAlerts();

    if (draft.category === "Links") {
      const trimmedLinkUrl = String(draft.linkUrl || "").trim();
      const trimmedFileUrl = String(draft.fileUrl || "").trim();

      if (trimmedFileUrl) {
        setError(`For ${draft.category} category, file URL is not allowed.`);
        return;
      }

      if (!trimmedLinkUrl) {
        setError(`For ${draft.category} category, Link URL is required.`);
        return;
      }
    }

    if (draft.category === "Notes") {
      const trimmedLinkUrl = String(draft.linkUrl || "").trim();
      const trimmedFileUrl = String(draft.fileUrl || "").trim();

      if (trimmedLinkUrl && !isLikelyNotesFileUrl(trimmedLinkUrl)) {
        setError("For Notes category, link URL must end with .png or .pdf.");
        return;
      }

      if (trimmedFileUrl && !isLikelyNotesFileUrl(trimmedFileUrl)) {
        setError("For Notes category, file URL must end with .png or .pdf.");
        return;
      }
    }

    if (draft.category === "Research Papers") {
      const trimmedLinkUrl = String(draft.linkUrl || "").trim();
      const trimmedFileUrl = String(draft.fileUrl || "").trim();
      const videoPattern = /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|\.(mp4|webm|ogg|mov|m4v|avi|mkv)(\?.*)?$/i;

      if (trimmedLinkUrl && videoPattern.test(trimmedLinkUrl)) {
        setError("For Research Papers category, video links are not allowed.");
        return;
      }

      if (trimmedFileUrl && videoPattern.test(trimmedFileUrl)) {
        setError("For Research Papers category, video URLs are not allowed.");
        return;
      }
    }

    try {
      setActionLoadingId("edit-" + id);

      const res = await fetch(API_BASE + "/" + id, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify(draft),
      });
      const data = await parseApiResponse(res);

      if (!res.ok) throw new Error(data.message || "Update failed");

      setSuccess("Resource updated and sent for re-review.");
      cancelEdit(id);

      await fetchMyResources();
      await fetchBrowseResources();
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setActionLoadingId("");
    }
  };

  const deleteResource = async (id) => {
    resetAlerts();
    try {
      setActionLoadingId("delete-" + id);

      const res = await fetch(API_BASE + "/" + id, {
        method: "DELETE",
        headers: authHeaders(false),
      });
      const data = await parseApiResponse(res);

      if (!res.ok) throw new Error(data.message || "Delete failed");

      setSuccess("Resource deleted.");
      await fetchMyResources();
      await fetchBrowseResources();
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setActionLoadingId("");
    }
  };

  const approveResource = async (id) => {
    resetAlerts();
    try {
      setActionLoadingId("approve-" + id);

      const res = await fetch(API_BASE + "/" + id + "/approve", {
        method: "PUT",
        headers: authHeaders(false),
      });
      const data = await parseApiResponse(res);

      if (!res.ok) throw new Error(data.message || "Approve failed");

      setSuccess("Resource approved.");
      await fetchPendingResources();
      await fetchBrowseResources();
    } catch (err) {
      setError(err.message || "Approve failed");
    } finally {
      setActionLoadingId("");
    }
  };

  const rejectResource = async (id) => {
    resetAlerts();
    try {
      setActionLoadingId("reject-" + id);

      const res = await fetch(API_BASE + "/" + id + "/reject", {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({
          rejectionReason: (rejectReasons[id] || "").trim(),
        }),
      });
      const data = await parseApiResponse(res);

      if (!res.ok) throw new Error(data.message || "Reject failed");

      setSuccess("Resource rejected.");
      setRejectReasons((prev) => ({ ...prev, [id]: "" }));
      await fetchPendingResources();
      await fetchBrowseResources();
    } catch (err) {
      setError(err.message || "Reject failed");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-7">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">UniHive Module</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Resource Sharing</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload and discover faculty-verified academic resources.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setTab("browse")}
          className={
            "rounded-lg px-4 py-2 text-sm font-semibold " +
            (tab === "browse" ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-700")
          }
        >
          Browse Approved
        </button>

        {isStudent ? (
          <button
            onClick={() => setTab("mine")}
            className={
              "rounded-lg px-4 py-2 text-sm font-semibold " +
              (tab === "mine" ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-700")
            }
          >
            My Uploads
          </button>
        ) : null}

        {isModerator ? (
          <button
            onClick={() => setTab("moderation")}
            className={
              "rounded-lg px-4 py-2 text-sm font-semibold " +
              (tab === "moderation" ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-700")
            }
          >
            Moderation Queue
          </button>
        ) : null}
      </div>

      {tab === "browse" ? (
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">Filters</p>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={browseFilters.category}
                onChange={(e) => setBrowseFilters((p) => ({ ...p, category: e.target.value }))}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Subject"
                value={browseFilters.subject}
                onChange={(e) => setBrowseFilters((p) => ({ ...p, subject: e.target.value }))}
              />

              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Module"
                value={browseFilters.module}
                onChange={(e) => setBrowseFilters((p) => ({ ...p, module: e.target.value }))}
              />

              <input
                type="date"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={browseFilters.uploadDate}
                onChange={(e) => setBrowseFilters((p) => ({ ...p, uploadDate: e.target.value }))}
              />

              {isModerator ? (
                <select
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={browseFilters.approvalStatus}
                  onChange={(e) => setBrowseFilters((p) => ({ ...p, approvalStatus: e.target.value }))}
                >
                  <option value="">Default (Approved only)</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <button onClick={applyBrowseFilters} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
                  Apply
                </button>
                <button onClick={resetBrowseFilters} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                  Reset
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading resources...</div>
          ) : browseResources.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              No resources found for current filters.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {browseResources.map((resource) => (
                <article key={resource._id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-800">{resource.title}</h3>
                    <span className={"rounded-full border px-2 py-1 text-xs font-semibold " + statusBadgeClass(resource.approvalStatus)}>
                      {resource.approvalStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {resource.category} • {resource.subject}
                    {resource.module ? " • " + resource.module : ""}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{resource.description || "No description provided."}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Uploaded by {resource.uploader?.name || "Unknown"} • {new Date(resource.createdAt).toLocaleString()}
                  </p>

                  <div className="mt-3 flex gap-2">
                    {resource.category === "Videos" ? (
                      <button
                        type="button"
                        onClick={() => openResourceInNewTab(resource)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                        title="Open video in browser"
                      >
                        ▶ Video
                      </button>
                    ) : null}

                    {resource.category !== "Videos" && (resource.linkUrl || resource.fileUrl) ? (
                      <button
                        type="button"
                        onClick={() => openResourceInNewTab(resource)}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                      >
                        Open Resource
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <span className="text-slate-600">
              Page {browsePagination.page} of {browsePagination.totalPages || 1}
            </span>
            <div className="flex gap-2">
              <button
                disabled={browsePagination.page <= 1}
                onClick={() => goToBrowsePage(browsePagination.page - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={browsePagination.page >= browsePagination.totalPages}
                onClick={() => goToBrowsePage(browsePagination.page + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "mine" && isStudent ? (
        <section className="space-y-4">
          <form onSubmit={handleUploadSubmit} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">Upload Resource</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))}
              />

              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={uploadForm.category}
                onChange={(e) => setUploadForm((p) => ({ ...p, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Subject"
                value={uploadForm.subject}
                onChange={(e) => setUploadForm((p) => ({ ...p, subject: e.target.value }))}
              />

              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Module (optional)"
                value={uploadForm.module}
                onChange={(e) => setUploadForm((p) => ({ ...p, module: e.target.value }))}
              />

              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Link URL (optional)"
                value={uploadForm.linkUrl}
                onChange={(e) => setUploadForm((p) => ({ ...p, linkUrl: e.target.value }))}
              />

              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Direct fileUrl (optional)"
                value={uploadForm.fileUrl}
                disabled={uploadForm.category === "Links"}
                onChange={(e) => setUploadForm((p) => ({ ...p, fileUrl: e.target.value }))}
              />
            </div>

            <textarea
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows="3"
              placeholder="Description"
              value={uploadForm.description}
              onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))}
            />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {uploadForm.category === "Notes" || uploadForm.category === "Research Papers" || uploadForm.category === "Videos" ? (
                <input
                 type="file"
                 accept={
                   uploadForm.category === "Videos"
                     ? "video/*"
                     : uploadForm.category === "Notes"
                     ? ".png,.pdf,image/png,application/pdf"
                     : ".pdf,.doc,.docx,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/rtf"
                 }
                 onChange={(e) => setUploadForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
               />
              ) : null}

              <button
                type="submit"
                disabled={actionLoadingId === "upload"}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {actionLoadingId === "upload" ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
          </form>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">My Uploads</p>

            {loading ? (
              <p className="text-sm text-slate-500">Loading your resources...</p>
            ) : myResources.length === 0 ? (
              <p className="text-sm text-slate-500">No resources uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {myResources.map((resource) => {
                  const draft = editDrafts[resource._id];
                  const isEditing = Boolean(draft);

                  return (
                    <div key={resource._id} className="rounded-lg border border-slate-200 p-3">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                            value={draft.title}
                            onChange={(e) =>
                              setEditDrafts((prev) => ({
                                ...prev,
                                [resource._id]: { ...prev[resource._id], title: e.target.value },
                              }))
                            }
                          />
                          <textarea
                            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                            rows="2"
                            value={draft.description}
                            onChange={(e) =>
                              setEditDrafts((prev) => ({
                                ...prev,
                                [resource._id]: { ...prev[resource._id], description: e.target.value },
                              }))
                            }
                          />
                          <div className="grid gap-2 md:grid-cols-3">
                            <select
                              className="rounded border border-slate-200 px-2 py-1.5 text-sm"
                              value={draft.category}
                              onChange={(e) =>
                                setEditDrafts((prev) => ({
                                  ...prev,
                                  [resource._id]: { ...prev[resource._id], category: e.target.value },
                                }))
                              }
                            >
                              {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                            <input
                              className="rounded border border-slate-200 px-2 py-1.5 text-sm"
                              value={draft.subject}
                              onChange={(e) =>
                                setEditDrafts((prev) => ({
                                  ...prev,
                                  [resource._id]: { ...prev[resource._id], subject: e.target.value },
                                }))
                              }
                              placeholder="Subject"
                            />
                            <input
                              className="rounded border border-slate-200 px-2 py-1.5 text-sm"
                              value={draft.module}
                              onChange={(e) =>
                                setEditDrafts((prev) => ({
                                  ...prev,
                                  [resource._id]: { ...prev[resource._id], module: e.target.value },
                                }))
                              }
                              placeholder="Module"
                            />
                          </div>
                          <input
                            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                            value={draft.linkUrl}
                            onChange={(e) =>
                              setEditDrafts((prev) => ({
                                ...prev,
                                [resource._id]: { ...prev[resource._id], linkUrl: e.target.value },
                              }))
                            }
                            placeholder="Link URL"
                          />
                          <input
                            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                            value={draft.fileUrl}
                            onChange={(e) =>
                              setEditDrafts((prev) => ({
                                ...prev,
                                [resource._id]: { ...prev[resource._id], fileUrl: e.target.value },
                              }))
                            }
                            placeholder="fileUrl"
                          />

                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(resource._id)}
                              disabled={actionLoadingId === "edit-" + resource._id}
                              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => cancelEdit(resource._id)}
                              className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-800">{resource.title}</h4>
                            <span className={"rounded-full border px-2 py-0.5 text-xs font-semibold " + statusBadgeClass(resource.approvalStatus)}>
                              {resource.approvalStatus}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {resource.category} • {resource.subject}
                            {resource.module ? " • " + resource.module : ""}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">{resource.description || "No description"}</p>
                          {resource.rejectionReason ? <p className="mt-1 text-xs text-red-600">Reject reason: {resource.rejectionReason}</p> : null}

                          <div className="mt-2 flex gap-2">
                            {resource.category === "Videos" ? (
                              <button
                                type="button"
                                onClick={() => openResourceInNewTab(resource)}
                                className="rounded bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                                title="Open video in browser"
                              >
                                ▶ Video
                              </button>
                            ) : null}

                            <button
                              onClick={() => startEdit(resource)}
                              className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteResource(resource._id)}
                              disabled={actionLoadingId === "delete-" + resource._id}
                              className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {tab === "moderation" && isModerator ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">Pending Review Queue</p>

          {loading ? (
            <p className="text-sm text-slate-500">Loading pending resources...</p>
          ) : pendingResources.length === 0 ? (
            <p className="text-sm text-slate-500">No pending resources.</p>
          ) : (
            <div className="space-y-3">
              {pendingResources.map((resource) => (
                <div key={resource._id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-800">{resource.title}</h4>
                    <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      pending
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {resource.category} • {resource.subject}
                    {resource.module ? " • " + resource.module : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{resource.description || "No description"}</p>
                  <p className="mt-1 text-xs text-slate-400">Uploader: {resource.uploader?.name || "Unknown"}</p>

                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <input
                      className="rounded border border-slate-200 px-2 py-1.5 text-sm"
                      placeholder="Optional rejection reason"
                      value={rejectReasons[resource._id] || ""}
                      onChange={(e) => setRejectReasons((prev) => ({ ...prev, [resource._id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveResource(resource._id)}
                        disabled={actionLoadingId === "approve-" + resource._id}
                        className="rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectResource(resource._id)}
                        disabled={actionLoadingId === "reject-" + resource._id}
                        className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
};

export default ResourceShare;