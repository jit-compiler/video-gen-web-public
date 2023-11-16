"use client";
import React, { useState } from "react";
import axios from "axios";
import styles from "@/css/Trivia.module.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

const Trivia = () => {
  const [amount, setAmount] = useState(0);
  const [videoLinks, setVideoLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [templateID, setTemplateID] = useState("");

  const createVideos = async () => {
    if (amount && apiKey && templateID) {
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
        setProgress("Questions Selected");

        // Set up Shotstack API configurations
        const shotstackApiUrl = "https://api.shotstack.io/v1";

        // Prepare an array to store video links
        const newVideoLinks = [];

        // Prepare an array to store all the promises
        const promises = [];

        for (let i = 0; i < selectedQuestions.length; i++) {
          const question = selectedQuestions[i];
          console.log(question["Question"]);
          const mergeFields = [
            { find: "question", replace: question["Question"] },
            { find: "option1", replace: question["Option A"] },
            { find: "option2", replace: question["Option B"] },
            { find: "option3", replace: question["Option C"] },
            { find: "answer", replace: question["Answer"] },
          ];

          const requestData = {
            id: templateID,
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

          // Add the promise to the array
          promises.push(axios(config));
        }

        // Wait for all the promises to resolve
        const responses = await Promise.all(promises);

        // Polling for rendering status
        const statusPromises = responses.map(async (response, index) => {
          let renderStatus = "queued";
          while (renderStatus !== "done" && renderStatus !== "failed") {
            try {
              const renderResponse = await axios.get(
                `https://api.shotstack.io/v1/render/${response.data.response.id}`,
                {
                  headers: {
                    "x-api-key": apiKey,
                  },
                }
              );
              renderStatus = renderResponse.data.response.status;
              console.log(`Render Status: ${renderStatus}`);
              setProgress("Render Status: Rendering"); // Set the progress to "Rendering"
              if (renderStatus === "done") {
                const videoUrl = renderResponse.data.response.url;
                newVideoLinks.push(videoUrl);
                console.log(`Video URL: ${videoUrl}`);
                setVideoLinks([...videoLinks, videoUrl]); // Update the state with the new video link
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
        });

        // Wait for all the status promises to resolve
        await Promise.all(statusPromises);

        // Update the state with new video links
        setProgress("Render Status: Done");
        setVideoLinks(newVideoLinks);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      function () {
        console.log("Copying to clipboard was successful!");
        toast.success("Copied To Clipboard!", {
          autoClose: 500,
          hideProgressBar: true,
        });
      },
      function (err) {
        console.error("Could not copy text: ", err);
      }
    );
  };

  return (
    <div>
      <ToastContainer />
      <div className={styles.header}>
        <h1>Create videos</h1>
        <input
          type="text"
          placeholder="Shotstack api key"
          onChange={(e) => {
            setApiKey(e.target.value);
          }}
        />
        <input
          type="text"
          placeholder="Shotstack template ID"
          onChange={(e) => {
            setTemplateID(e.target.value);
          }}
        />
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
        {progress}
      </div>
      <div className={styles.videos}>
        {videoLinks.map((link, index) => (
          <div key={index} className={styles.video__wrapper}>
            <video controls width="180" height="320">
              <source src={link} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <button
              onClick={() => copyToClipboard(link)}
              className={styles.copy}
            >
              Copy Link
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Trivia;
