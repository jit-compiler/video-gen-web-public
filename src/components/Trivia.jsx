"use client";
import React, { useState } from "react";
import axios from "axios";

const Trivia = () => {
  const [amount, setAmount] = useState(0);
  const [videoLinks, setVideoLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  const createVideos = async () => {
    if (amount) {
      setLoading(true);
      try {
        // Fetch questions from our API using Axios
        const questionsRes = await axios.get("/api/questions");
        const questions = questionsRes.data;
        let selectedQuestions = [];

        for (let i = 0; i < amount; i++) {
          selectedQuestions.push(
            questions[Math.floor(Math.random() * questions.length)]
          );
        }

        console.log(selectedQuestions);

        // Set up Shotstack API configurations
        const apiKey = "iGJpKfdikkOVmEAlWnX6tfw5l5hHJ6jQxl9cZMYR";
        const shotstackApiUrl = "https://api.shotstack.io/v1";
        const templateId = "72b36571-12d7-431f-8986-148c5f786ef7";

        // Prepare an array to store video links
        const newVideoLinks = [];

        for (const question of selectedQuestions) {
          console.log(question["Question"]);
          const mergeFields = [
            { find: "question", replace: question["Question"] },
            { find: "option1", replace: question["Option A"] },
            { find: "option2", replace: question["Option B"] },
            { find: "option3", replace: question["Option C"] },
            { find: "answer", replace: question["Answer"] },
          ];

          const requestData = {
            id: templateId,
            merge: mergeFields,
          };

          const config = {
            method: "post",
            url: `https://api.shotstack.io/v1/templates/render`,
            headers: {
              "content-type": "application/json",
              "x-api-key": "iGJpKfdikkOVmEAlWnX6tfw5l5hHJ6jQxl9cZMYR",
            },
            data: requestData,
          };

          try {
            const response = await axios(config);
            console.log(JSON.stringify(response.data, null, 2));

            // Polling for rendering status
            let renderStatus = "queued";

            while (renderStatus !== "done" && renderStatus !== "failed") {
              try {
                const renderResponse = await axios.get(
                  `https://api.shotstack.io/v1/render/${response.data.response.id}`,
                  {
                    headers: {
                      "x-api-key": "iGJpKfdikkOVmEAlWnX6tfw5l5hHJ6jQxl9cZMYR",
                    },
                  }
                );
                renderStatus = renderResponse.data.response.status;
                console.log(`Render Status: ${renderStatus}`);

                if (renderStatus === "done") {
                  const videoUrl = renderResponse.data.response.url;
                  newVideoLinks.push(videoUrl);
                  console.log(`Video URL: ${videoUrl}`);
                } else if (renderStatus === "failed") {
                  console.log("Video rendering failed.");
                }

                // Sleep for a specific duration before polling again
                await new Promise((resolve) => setTimeout(resolve, 5000));
              } catch (e) {
                console.log(`Unable to get the render status: ${e}`);
                break; // Exit the loop if an error occurs
              }
            }
          } catch (error) {
            console.error(error);
          }
        }

        // Update the state with new video links
        setVideoLinks(newVideoLinks);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <h1>Create videos</h1>
      <input
        type="number"
        placeholder="How many videos?"
        onChange={(e) => {
          setAmount(e.target.value);
        }}
      />
      <button onClick={createVideos} disabled={loading}>
        {loading ? "Loading..." : "Submit"}
      </button>
      {videoLinks.map((link, index) => (
        <div key={index}>
          <video controls width="320" height="240">
            <source src={link} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <a href={link} target="_blank" rel="noopener noreferrer">
            Video {index + 1}
          </a>
        </div>
      ))}
    </div>
  );
};

export default Trivia;
