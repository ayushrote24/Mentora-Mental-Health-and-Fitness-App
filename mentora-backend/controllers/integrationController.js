const { env } = require('../config/env');

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
];

const buildDistance = (latitude, longitude, doctor) => {
  if (!doctor.geometry?.location) {
    return null;
  }

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(doctor.geometry.location.lat - latitude);
  const dLon = toRadians(doctor.geometry.location.lng - longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(latitude)) *
      Math.cos(toRadians(doctor.geometry.location.lat)) *
      Math.sin(dLon / 2) ** 2;
  const distance = earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
};

const getNearbyDoctors = async (req, res, next) => {
  try {
    const { latitude, longitude, keyword = 'doctor', radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      const error = new Error('Latitude and longitude are required.');
      error.statusCode = 400;
      throw error;
    }

    if (!env.googlePlacesApiKey) {
      console.warn('Google Places API key missing, skipping nearby doctors lookup.');
      return res.json({
        success: true,
        message: 'Google Places disabled in this environment.',
        data: [],
      });
    }

    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}` +
      `&radius=${radius}&keyword=${encodeURIComponent(keyword)}&type=doctor&key=${env.googlePlacesApiKey}`;

    const response = await fetch(url);
    const payload = await response.json();

    if (!response.ok || payload.status === 'REQUEST_DENIED') {
      const error = new Error(payload.error_message || 'Unable to fetch nearby doctors.');
      error.statusCode = response.status || 502;
      throw error;
    }

    const doctors = (payload.results || []).map((doctor) => ({
      ...doctor,
      distance: buildDistance(Number(latitude), Number(longitude), doctor),
    }));

    res.json({
      success: true,
      message: 'Nearby doctors fetched successfully.',
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
};

const chatWithAssistant = async (req, res, next) => {
  try {
    const { message, profile, healthData, history = [] } = req.body || {};

    if (!message) {
      const error = new Error('Message is required.');
      error.statusCode = 400;
      throw error;
    }

    if (!env.geminiApiKey) {
      const error = new Error('Gemini API key is not configured on the backend.');
      error.statusCode = 503;
      throw error;
    }

    const safeHistory = history
      .slice(-8)
      .map((entry) => `${entry.role === 'user' ? 'User' : 'Assistant'}: ${entry.text}`)
      .join('\n');

    const systemPrompt = [
      'You are Mentora, a warm, trustworthy wellness companion.',
      'Your role is to support mood, emotional wellbeing, healthy habits, self-care, and motivation.',
      'Respond like a calm supportive mental-health coach, not like a cold assistant.',
      'Use the provided profile and health data to personalize advice.',
      'Never claim to be a psychiatrist, therapist, or doctor.',
      'Never diagnose, prescribe medicines, or present uncertain information as medical fact.',
      'For serious symptoms, self-harm, suicidal thoughts, abuse, panic with danger, chest pain, breathing trouble, or medication emergencies: clearly tell the user to contact local emergency services or a licensed doctor immediately.',
      'For normal mood support: validate feelings first, then give 2 to 4 practical steps.',
      'Keep answers concise enough to fit in one complete response.',
      'Use short paragraphs or a short flat list.',
      'For most replies, format with bold labels like **Main point:**, **Why it matters:**, and **What to do:**.',
      'Under **What to do:** give only 2 to 4 short, practical points.',
      'If the user asks for a diet plan, meal plan, gym plan, exercise routine, or weekly health plan, provide a practical day-by-day plan tailored to their BMI, weight, step goal, and general wellness context.',
      'For diet plans: suggest realistic breakfast, lunch, dinner, snacks, hydration, and simple nutrition guidance. Keep it affordable and practical unless the user asks otherwise.',
      'For workout plans: include exercise names, sets, reps, rest time, and workout split for each day when relevant.',
      'For beginners, prefer safe, moderate training volume and clearly mention warm-up, form, rest, and recovery.',
      'Do not prescribe extreme dieting, unsafe calorie restriction, steroid use, or unsafe exercise loads.',
      'If the user has obesity, underweight BMI, pain, injury, pregnancy concerns, severe fatigue, or a medical condition, suggest seeing a licensed doctor or trainer before intense exercise.',
      'When relevant, encourage hydration, sleep, walking, breathing exercises, journaling, social support, and professional help.',
      `Profile: ${JSON.stringify(profile || {})}`,
      `Health data: ${JSON.stringify(healthData || {})}`,
      safeHistory ? `Recent conversation:\n${safeHistory}` : '',
      `User message: ${message}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    let text = '';
    let lastError = null;

    for (const model of GEMINI_MODELS) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: systemPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 900,
            },
          }),
        }
      );

      const payload = await response.json();

      if (response.ok) {
        text =
          payload?.candidates?.[0]?.content?.parts?.[0]?.text ||
          '';
        if (text) {
          break;
        }
      } else {
        lastError = new Error(payload?.error?.message || `Assistant request failed for ${model}.`);
        lastError.statusCode = response.status || 502;
      }
    }
    if (!text) {
      if (lastError) {
        throw lastError;
      }
      text = "I'm having trouble responding right now. Please try again in a moment.";
    }

    res.json({
      success: true,
      message: 'Assistant response generated successfully.',
      data: {
        text,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNearbyDoctors,
  chatWithAssistant,
};
