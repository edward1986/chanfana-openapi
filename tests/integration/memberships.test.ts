import { SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it, vi } from "vitest";

let applications: any[] = [];
let idCounter = 1;

vi.mock("../../src/lib/firestore", () => {
    const mockDb = {
        add: vi.fn((data) => {
            const newId = String(idCounter++);
            const newApplication = { id: newId, ...data };
            applications.push(newApplication);
            return Promise.resolve(newApplication);
        }),
        collection: vi.fn((collectionName) => ({
            add: vi.fn((data) => {
                const newId = String(idCounter++);
                const newApplication = { id: newId, ...data };
                applications.push(newApplication);
                return Promise.resolve(newApplication);
            }),
        })),
    };

    return {
        getDb: vi.fn(() => mockDb),
    };
});

vi.mock("../../src/lib/github-upload", () => ({
    uploadToGitHub: vi.fn().mockResolvedValue({
        html_url: "http://example.com/html",
        download_url: "http://example.com/download",
    }),
}));


describe("Memberships API Integration Tests", () => {
    beforeEach(() => {
        applications = [];
        idCounter = 1;
        vi.clearAllMocks();
    });

    describe("POST /memberships/individual", () => {
        it("should create a new individual membership application successfully", async () => {
            const applicationData = {
                fullName: "John Doe",
                email: "john.doe@example.com",
                institution: "Test University",
                phone: "1234567890",
                applicationFormUri: "data:application/pdf;base64,dGVzdA==",
                applicationFormName: "application.pdf",
            };

            const response = await SELF.fetch("http://local.test/memberships/individual", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(applicationData),
            });

            const body = await response.json<any>();

            expect(response.status).toBe(201);
            expect(body).toHaveProperty("applicationId");
            expect(body).toHaveProperty("message", "Application submitted successfully. A confirmation email has been sent.");

            // Check if firestore add was called correctly
            const { getDb } = await import("../../src/lib/firestore");
            const db = getDb({} as any);
            expect(db.collection).toHaveBeenCalledWith("individualMemberships");
        });
    });

    describe("POST /memberships/institutional", () => {
        it("should create a new institutional membership application successfully", async () => {
            const applicationData = {
                institutionName: "Test University",
                contactPerson: "Jane Doe",
                email: "jane.doe@example.com",
                contactNumber: "0987654321",
                letterOfIntentUri: "data:application/pdf;base64,dGVzdA==",
                letterOfIntentName: "letter.pdf",
                registrationUri: "data:application/pdf;base64,dGVzdA==",
                registrationName: "registration.pdf",
                facultyListUri: "data:application/pdf;base64,dGVzdA==",
                facultyListName: "faculty.pdf",
                applicationFormUri: "data:application/pdf;base64,dGVzdA==",
                applicationFormName: "application.pdf",
            };

            const response = await SELF.fetch("http://local.test/memberships/institutional", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(applicationData),
            });

            const body = await response.json<any>();

            expect(response.status).toBe(201);
            expect(body).toHaveProperty("applicationId");
            expect(body).toHaveProperty("message", "Application submitted successfully.");

            const { getDb } = await import("../../src/lib/firestore");
            const db = getDb({} as any);
            expect(db.collection).toHaveBeenCalledWith("institutionalMemberships");
        });
    });
});
