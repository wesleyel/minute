"use client";

import { useTranslations } from "next-intl";
import { trpc } from "../../../_components/TrpcProvider";

type EndpointProps = {
  method: string;
  path: string;
  description: string;
  requestBody?: { field: string; type: string; required: boolean; description: string }[];
  queryParams?: { field: string; type: string; required: boolean; description: string }[];
  responseExample: string;
};

const methodColors: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700",
  POST: "bg-green-100 text-green-700",
  PUT: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
};

const Endpoint = ({
  method,
  path,
  description,
  requestBody,
  queryParams,
  responseExample,
}: EndpointProps) => {
  return (
    <div className="border border-gray-200 rounded-sm mb-4 overflow-hidden">
      <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-200">
        <span
          className={`text-xs font-bold font-mono px-2 py-1 rounded-sm ${methodColors[method] ?? "bg-gray-100 text-gray-700"}`}
        >
          {method}
        </span>
        <code className="text-sm font-mono text-gray-800">{path}</code>
        <span className="text-sm text-gray-500">{description}</span>
      </div>
      <div className="p-4 space-y-4">
        {queryParams && queryParams.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Query Parameters
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="pb-1 pr-4 font-medium">Field</th>
                  <th className="pb-1 pr-4 font-medium">Type</th>
                  <th className="pb-1 pr-4 font-medium">Required</th>
                  <th className="pb-1 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {queryParams.map((p) => (
                  <tr key={p.field} className="border-t border-gray-100">
                    <td className="py-1 pr-4 font-mono text-xs">{p.field}</td>
                    <td className="py-1 pr-4 text-xs text-gray-600">{p.type}</td>
                    <td className="py-1 pr-4 text-xs text-gray-600">
                      {p.required ? "Yes" : "No"}
                    </td>
                    <td className="py-1 text-xs text-gray-600">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {requestBody && requestBody.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Request Body
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="pb-1 pr-4 font-medium">Field</th>
                  <th className="pb-1 pr-4 font-medium">Type</th>
                  <th className="pb-1 pr-4 font-medium">Required</th>
                  <th className="pb-1 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {requestBody.map((p) => (
                  <tr key={p.field} className="border-t border-gray-100">
                    <td className="py-1 pr-4 font-mono text-xs">{p.field}</td>
                    <td className="py-1 pr-4 text-xs text-gray-600">{p.type}</td>
                    <td className="py-1 pr-4 text-xs text-gray-600">
                      {p.required ? "Yes" : "No"}
                    </td>
                    <td className="py-1 text-xs text-gray-600">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Response Example
          </p>
          <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-sm overflow-x-auto">
            {responseExample}
          </pre>
        </div>
      </div>
    </div>
  );
};

export const ApiReferenceContainer = () => {
  const t = useTranslations("pages.ApiReference");
  const apiTokenQuery = trpc.currentUser.getApiToken.useQuery();
  const token = apiTokenQuery.data ?? "<YOUR_API_TOKEN>";

  return (
    <div className="flex-1 h-full p-6 max-w-4xl">
      <h2 className="text-xl font-semibold mb-1">{t("title")}</h2>
      <p className="text-sm text-gray-500 mb-6">{t("description")}</p>

      <section className="mb-8">
        <h3 className="text-base font-semibold mb-2">{t("authentication")}</h3>
        <p className="text-sm text-gray-600 mb-3">{t("authDescription")}</p>
        <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-sm overflow-x-auto">
          {`Authorization: Bearer ${token}`}
        </pre>
      </section>

      <section>
        <h3 className="text-base font-semibold mb-4">{t("endpoints")}</h3>

        <Endpoint
          method="GET"
          path="/api/entries"
          description={t("getEntriesDescription")}
          queryParams={[
            {
              field: "cursor[startedAt]",
              type: "string (ISO 8601)",
              required: false,
              description: t("cursorStartedAt"),
            },
            {
              field: "cursor[id]",
              type: "string (UUID)",
              required: false,
              description: t("cursorId"),
            },
          ]}
          responseExample={`[
  {
    "id": "uuid",
    "startedAt": "2024-01-01T00:00:00.000Z",
    "stoppedAt": "2024-01-01T01:00:00.000Z",
    "description": "Task description",
    "folderId": "uuid"
  }
]`}
        />

        <Endpoint
          method="POST"
          path="/api/entries"
          description={t("postEntriesDescription")}
          requestBody={[
            {
              field: "startedAt",
              type: "string (ISO 8601)",
              required: true,
              description: t("startedAt"),
            },
            {
              field: "stoppedAt",
              type: "string (ISO 8601)",
              required: true,
              description: t("stoppedAt"),
            },
            {
              field: "description",
              type: "string",
              required: true,
              description: t("description"),
            },
            {
              field: "folderId",
              type: "string (UUID)",
              required: true,
              description: t("folderId"),
            },
          ]}
          responseExample={`{ "success": true }`}
        />

        <Endpoint
          method="GET"
          path="/api/entries/:id"
          description={t("getEntryDescription")}
          responseExample={`{
  "id": "uuid",
  "startedAt": "2024-01-01T00:00:00.000Z",
  "stoppedAt": "2024-01-01T01:00:00.000Z",
  "description": "Task description",
  "folderId": "uuid"
}`}
        />

        <Endpoint
          method="PUT"
          path="/api/entries/:id"
          description={t("putEntryDescription")}
          requestBody={[
            {
              field: "startedAt",
              type: "string (ISO 8601)",
              required: false,
              description: t("startedAt"),
            },
            {
              field: "stoppedAt",
              type: "string (ISO 8601)",
              required: false,
              description: t("stoppedAt"),
            },
            {
              field: "description",
              type: "string",
              required: false,
              description: t("description"),
            },
            {
              field: "folderId",
              type: "string (UUID)",
              required: false,
              description: t("folderId"),
            },
          ]}
          responseExample={`{ "success": true }`}
        />

        <Endpoint
          method="DELETE"
          path="/api/entries/:id"
          description={t("deleteEntryDescription")}
          responseExample={`{ "success": true }`}
        />
      </section>
    </div>
  );
};
