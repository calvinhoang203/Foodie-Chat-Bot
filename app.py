import os
import sys
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv() # Load the API key

# Set the encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Create the model
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
    system_instruction="You are an expert at giving out recommendation on where to eat around the world. Your task is to engage in conversations about the restaurant locations and answer questions. Use analogies and detailed examples that are relatable. Ask questions so that you can better understand the user and improve the user experience. Give out some real reviews about the restaurants and the kind of cuisine they serve.",
)

history = [] # Empty list to store conversation


if len(sys.argv) > 2:
    user_input = sys.argv[1] # Get user input from command line arguments
    history = json.loads(sys.argv[2]) # Get conversation history from command line arguments

    # user_name = extract_name(history) # Extract user's name from the history

    if user_input.lower() == 'thanks':
        print("Your welcome! Have a wonderful day!") # Exit message if user wants to quit
    else:
        chat_session = model.start_chat(history=history) # Start a chat session with the model
        try:
            response = chat_session.send_message(user_input) # Send user input to the model
            model_response = response.text

            # if user_name:
            #     model_response = model_response.replace("User", user_name) # Personalize the response with the user's name

            print(f'{model_response}') # Print the model's response
            updated_history = history + [
              {"role": "user", "parts": [user_input]}, # Update conversation history with user input
              {"role": "model", "parts": [model_response]} # Update conversation history with model response
            ]
        except genai.types.generation_types.StopCandidateException as e:
            print("Sorry, I couldn't process that request due to safety concerns. Can you please rephrase?")
else:
    print("No input or history provided") # Error message if no input or history is provided



