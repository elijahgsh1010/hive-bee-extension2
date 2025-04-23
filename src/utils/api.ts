import { ofetch } from 'ofetch'
import {stringifyQuery} from "ufo";
import type {MaybeRefOrGetter} from "vue";

// Add this type for better TypeScript support
type FetchOptions = Parameters<typeof fetch>[1]

const router = useRouter()

export const $api = ofetch.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    async onRequest({ options }) {
        chrome.storage.local.get('hiveAccessToken', function (result) {
            if(result.hiveAccessToken){
                options.headers = {
                    Authorization: `Bearer ${result.hiveAccessToken}`,
                }
            }
        });
    },

    async onResponseError({ request, response, options }) {
        if(response.status == 401) {
            return;
        }

        if(response.status != 500 && response.status != 400) {
            return;
        }

        const errorMessage = await response.json().catch(() => null); // Extract error message JSON or handle unknown cases
        const userFriendlyMessage = response._data.error;

        const message = userFriendlyMessage || errorMessage?.message || response.statusText || `An error occurred (${response.status})`;

    },

    ignoreResponseError: false
})

/**
 * Creates a parameter string from the given object.
 *
 * (objectToConvert: {MaybeRefOrGetter<Record<string, any>>}) - The object to convert to a parameter string.
 * @example const query = { name: 'John Doe', age: 30 };
 * createParamString(query) //will return 'name=John Doe&age=30'
 * @return {string} The parameter string created from the object.
 */
export const createParamString = ( objectToConvert: MaybeRefOrGetter<Record<string, any>> ) => {

    const _query = toValue(objectToConvert);
    const queryObj = Object.fromEntries(
        Object.entries(_query).map(([key, val]) => [key, toValue(val)]),
    )
    return stringifyQuery(queryObj);
}

