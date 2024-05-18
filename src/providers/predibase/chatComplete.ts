import { PREDIBASE } from '../../globals';
import {
  ChatCompletionResponse,
  ErrorResponse,
  ProviderConfig,
} from '../types';
import {
  generateErrorResponse,
  generateInvalidProviderResponseError,
  splitString,
} from '../utils';

export const PredibaseChatCompleteConfig: ProviderConfig = {
  model: {
    param: 'model',
    required: false,
    // The Predibase model format is "<base_model>[:adapter_id]".
    transform: (value: PredibaseChatCompleteResponse) => {
      return splitString(value.model, ':').after;
    },
  },
  messages: {
    param: 'messages',
    required: true,
    default: [],
  },
  max_tokens: {
    param: 'max_tokens',
    required: false,
    default: 4096,
    min: 0,
  },
  temperature: {
    param: 'temperature',
    required: false,
    default: 0.1,
    min: 0,
    max: 1,
  },
  top_p: {
    param: 'top_p',
    required: false,
    default: 1,
    min: 0,
    max: 1,
  },
  response_format: {
    param: 'response_format',
    required: false,
  },
  stream: {
    param: 'stream',
    required: false,
    default: false,
  },
  n: {
    param: 'n',
    required: false,
    default: 1,
    max: 1,
    min: 1,
  },
  stop: {
    param: 'stop',
    required: false,
  },
  top_k: {
    param: 'top_k',
    required: false,
    default: -1,
  },
  best_of: {
    param: 'best_of',
    required: false,
  },
};

interface PredibaseChatCompleteResponse extends ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface PredibaseErrorResponse extends ErrorResponse {}

export const PredibaseChatCompleteResponseTransform: (
  response: PredibaseChatCompleteResponse | PredibaseErrorResponse,
  responseStatus: number
) => ChatCompletionResponse | ErrorResponse = (response, responseStatus) => {
  if ('error' in response && responseStatus !== 200) {
    return generateErrorResponse(
      {
        message: response.error.message,
        type: response.error.type,
        param: null,
        code: response.error.code?.toString() || null,
      },
      PREDIBASE
    );
  }

  if ('choices' in response) {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      provider: PREDIBASE,
      choices: response.choices.map((c) => ({
        index: c.index,
        message: c.message,
        logprobs: c.logprobs,
        finish_reason: c.finish_reason,
      })),
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      },
    };
  }

  return generateInvalidProviderResponseError(response, PREDIBASE);
};
