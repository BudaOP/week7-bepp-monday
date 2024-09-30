const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app"); // Your Express app
const api = supertest(app);
const Job = require("../models/jobModel"); // Your Job model

// Sample data for jobs
const jobs = [
  {
    title: "Software Engineer",
    type: "Full-Time",
    description: "Develop and maintain web applications.",
    company: {
      name: "Tech Corp",
      contactEmail: "hr@techcorp.com",
      contactPhone: "123456789",
    },
  },
  {
    title: "Data Scientist",
    type: "Part-Time",
    description: "Analyze data and build machine learning models.",
    company: {
      name: "Data Labs",
      contactEmail: "hr@datalabs.com",
      contactPhone: "987654321",
    },
  },
];

describe("Jobs API non-protected routes", () => {
  // Set up and tear down before and after each test
  beforeEach(async () => {
    await Job.deleteMany({});
    await Job.insertMany(jobs);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Test GET /api/jobs
  it("should return all jobs as JSON when GET /api/jobs is called", async () => {
    const response = await api
      .get("/api/jobs")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body).toHaveLength(jobs.length);
  });

  // Test POST /api/jobs
  it("should create a new job when POST /api/jobs is called", async () => {
    const newJob = {
      title: "Product Manager",
      type: "Full-Time",
      description: "Lead product teams and define strategy.",
      company: {
        name: "Innovative Solutions",
        contactEmail: "hr@innovativesolutions.com",
        contactPhone: "1122334455",
      },
    };

    const response = await api
      .post("/api/jobs")
      .send(newJob)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const jobsAfterPost = await Job.find({});
    expect(jobsAfterPost).toHaveLength(jobs.length + 1);
    const jobTitles = jobsAfterPost.map((job) => job.title);
    expect(jobTitles).toContain(newJob.title);
  });

  // Test GET /api/jobs/:id
  it("should return one job by ID when GET /api/jobs/:id is called", async () => {
    const job = await Job.findOne();
    await api
      .get(`/api/jobs/${job.id}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  it("should return 404 for a non-existing job ID when GET /api/jobs/:id is called", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    await api.get(`/api/jobs/${nonExistentId}`).expect(404);
  });

  // Test PUT /api/jobs/:id
  it("should update a job by ID when PUT /api/jobs/:id is called", async () => {
    const job = await Job.findOne();
    const updatedJob = {
      title: "Senior Software Engineer",
      description: "Lead software engineering teams.",
      company: {
        name: "Tech Corp",
        contactEmail: "hr@techcorp.com",
        contactPhone: "123456789",
      },
    };

    await api
      .put(`/api/jobs/${job.id}`)
      .send(updatedJob)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const updatedJobCheck = await Job.findById(job.id);
    expect(updatedJobCheck.title).toBe(updatedJob.title);
    expect(updatedJobCheck.description).toBe(updatedJob.description);
  });

  // Test DELETE /api/jobs/:id
  it("should delete one job by ID when DELETE /api/jobs/:id is called", async () => {
    const job = await Job.findOne();
    await api.delete(`/api/jobs/${job.id}`).expect(204);

    const deletedJobCheck = await Job.findById(job.id);
    expect(deletedJobCheck).toBeNull();
  });

  it("should return 400 for an invalid job ID when DELETE /api/jobs/:id is called", async () => {
    const invalidId = "12345"; // Invalid MongoDB ObjectId
    await api.delete(`/api/jobs/${invalidId}`).expect(400);
  });
});
