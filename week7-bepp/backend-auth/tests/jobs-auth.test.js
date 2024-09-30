const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app"); // Your Express app
const api = supertest(app);
const Job = require("../models/jobModel");
const User = require("../models/userModel");

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

let token = null;

beforeAll(async () => {
  // Clear users and create a new user for authentication
  await User.deleteMany({});
  const result = await api.post("/api/users/signup").send({
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
    phone_number: "1234567890",
    gender: "Male",
    date_of_birth: "1990-01-01",
    membership_status: "Active",
  });
  token = result.body.token;
});

describe("Protected Jobs API endpoints", () => {
  beforeEach(async () => {
    // Clear the job collection and insert sample jobs
    await Job.deleteMany({});
    await Promise.all([
      api
        .post("/api/jobs")
        .set("Authorization", "bearer " + token)
        .send(jobs[0]),
      api
        .post("/api/jobs")
        .set("Authorization", "bearer " + token)
        .send(jobs[1]),
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Test GET /api/jobs (Protected)
  it("should return all jobs as JSON when GET /api/jobs is called with valid token", async () => {
    const response = await api
      .get("/api/jobs")
      .set("Authorization", "bearer " + token)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body).toHaveLength(jobs.length);
  });

  // Test POST /api/jobs (Protected)
  it("should create a new job when POST /api/jobs is called with valid token", async () => {
    const newJob = {
      title: "Product Manager",
      type: "Full-Time",
      description: "Lead the product team and define strategy.",
      company: {
        name: "Innovative Solutions",
        contactEmail: "hr@innovativesolutions.com",
        contactPhone: "1122334455",
      },
    };

    await api
      .post("/api/jobs")
      .set("Authorization", "bearer " + token)
      .send(newJob)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const jobsAfterPost = await Job.find({});
    expect(jobsAfterPost).toHaveLength(jobs.length + 1);

    const jobTitles = jobsAfterPost.map((job) => job.title);
    expect(jobTitles).toContain(newJob.title);
  });

  // Test PUT /api/jobs/:id (Protected)
  it("should update one job by ID when PUT /api/jobs/:id is called with valid token", async () => {
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

    const response = await api
      .put(`/api/jobs/${job.id}`)
      .set("Authorization", "bearer " + token)
      .send(updatedJob)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const updatedJobCheck = await Job.findById(job.id);
    expect(updatedJobCheck.title).toBe(updatedJob.title);
    expect(updatedJobCheck.description).toBe(updatedJob.description);
  });

  // Test DELETE /api/jobs/:id (Protected)
  it("should delete one job by ID when DELETE /api/jobs/:id is called with valid token", async () => {
    const job = await Job.findOne();
    await api
      .delete(`/api/jobs/${job.id}`)
      .set("Authorization", "bearer " + token)
      .expect(204);

    const deletedJobCheck = await Job.findById(job.id);
    expect(deletedJobCheck).toBeNull();
  });

  // Test invalid token handling
  it("should return 401 Unauthorized for requests with an invalid token", async () => {
    const job = await Job.findOne();
    await api
      .delete(`/api/jobs/${job.id}`)
      .set("Authorization", "bearer " + "invalidtoken")
      .expect(401);
  });

  // Test unauthorized user can't access protected routes
  it("should return 401 Unauthorized for POST /api/jobs without a token", async () => {
    const newJob = {
      title: "Unauthorized Job",
      type: "Part-Time",
      description: "This should not be allowed without a token.",
      company: {
        name: "Unauthorized Inc.",
        contactEmail: "unauthorized@company.com",
        contactPhone: "0000000000",
      },
    };

    await api.post("/api/jobs").send(newJob).expect(401);
  });
});
