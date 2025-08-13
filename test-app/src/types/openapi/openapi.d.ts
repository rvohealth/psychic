export interface paths {
    "/api/pets": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Pet"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/pets/{id}": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        trace?: never;
    };
    "/api/users": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        /** Format: date-time */
                        aDatetime?: string | null;
                        bio?: string;
                        /** Format: date */
                        birthdate?: string | null;
                        /** Format: bigint */
                        collarCount?: string | number | bigint | null;
                        collarCountInt?: number | null;
                        /** Format: decimal */
                        collarCountNumeric?: number | null;
                        /** Format: date */
                        createdOn?: string;
                        email?: string;
                        /** Format: bigint */
                        favoriteBigint?: string | number | bigint | null;
                        favoriteBigints?: (string | number | bigint)[] | null;
                        favoriteBooleans?: boolean[] | null;
                        favoriteCitext?: string | null;
                        favoriteCitexts?: string[] | null;
                        favoriteDates?: string[] | null;
                        favoriteDatetimes?: string[] | null;
                        favoriteIntegers?: number[] | null;
                        favoriteJsonbs?: Record<string, never>[] | null;
                        favoriteJsons?: Record<string, never>[] | null;
                        favoriteNumerics?: number[] | null;
                        favoriteTexts?: string[] | null;
                        favoriteTreats?: ("efishy feesh" | "snick snowcks")[] | null;
                        favoriteUuids?: string[] | null;
                        jsonData?: Record<string, never> | null;
                        jsonbData?: Record<string, never> | null;
                        likesTreats?: boolean;
                        likesWalks?: boolean | null;
                        name?: string | null;
                        nicknames?: string[] | null;
                        notes?: string | null;
                        optionalUuid?: string | null;
                        passwordDigest?: string;
                        /** Format: bigint */
                        requiredCollarCount?: string | number | bigint;
                        requiredCollarCountInt?: number;
                        /** Format: bigint */
                        requiredFavoriteBigint?: string | number | bigint;
                        requiredFavoriteBigints?: (string | number | bigint)[];
                        requiredFavoriteBooleans?: boolean[];
                        requiredFavoriteCitext?: string;
                        requiredFavoriteCitexts?: string[];
                        requiredFavoriteDates?: string[];
                        requiredFavoriteDatetimes?: string[];
                        requiredFavoriteIntegers?: number[];
                        requiredFavoriteJsonbs?: Record<string, never>[];
                        requiredFavoriteJsons?: Record<string, never>[];
                        requiredFavoriteNumerics?: number[];
                        requiredFavoriteTexts?: string[];
                        requiredFavoriteUuids?: string[];
                        requiredJsonData?: Record<string, never>;
                        requiredJsonbData?: Record<string, never>;
                        requiredNicknames?: string[];
                        /** @enum {string|null} */
                        species?: "cat" | "noncat" | null;
                        uuid?: string;
                        /** Format: decimal */
                        volume?: number | null;
                        password?: (string | null) | (number | null) | (Record<string, never> | null);
                        openapiVirtualSpecTest?: string | null;
                        openapiVirtualSpecTest2?: string[];
                    };
                };
            };
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/{id}": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        /** Format: date-time */
                        aDatetime?: string | null;
                        bio?: string;
                        /** Format: date */
                        birthdate?: string | null;
                        /** Format: bigint */
                        collarCount?: string | number | bigint | null;
                        collarCountInt?: number | null;
                        /** Format: decimal */
                        collarCountNumeric?: number | null;
                        /** Format: date */
                        createdOn?: string;
                        email?: string;
                        /** Format: bigint */
                        favoriteBigint?: string | number | bigint | null;
                        favoriteBigints?: (string | number | bigint)[] | null;
                        favoriteBooleans?: boolean[] | null;
                        favoriteCitext?: string | null;
                        favoriteCitexts?: string[] | null;
                        favoriteDates?: string[] | null;
                        favoriteDatetimes?: string[] | null;
                        favoriteIntegers?: number[] | null;
                        favoriteJsonbs?: Record<string, never>[] | null;
                        favoriteJsons?: Record<string, never>[] | null;
                        favoriteNumerics?: number[] | null;
                        favoriteTexts?: string[] | null;
                        favoriteTreats?: ("efishy feesh" | "snick snowcks")[] | null;
                        favoriteUuids?: string[] | null;
                        jsonData?: Record<string, never> | null;
                        jsonbData?: Record<string, never> | null;
                        likesTreats?: boolean;
                        likesWalks?: boolean | null;
                        name?: string | null;
                        nicknames?: string[] | null;
                        notes?: string | null;
                        optionalUuid?: string | null;
                        passwordDigest?: string;
                        /** Format: bigint */
                        requiredCollarCount?: string | number | bigint;
                        requiredCollarCountInt?: number;
                        /** Format: bigint */
                        requiredFavoriteBigint?: string | number | bigint;
                        requiredFavoriteBigints?: (string | number | bigint)[];
                        requiredFavoriteBooleans?: boolean[];
                        requiredFavoriteCitext?: string;
                        requiredFavoriteCitexts?: string[];
                        requiredFavoriteDates?: string[];
                        requiredFavoriteDatetimes?: string[];
                        requiredFavoriteIntegers?: number[];
                        requiredFavoriteJsonbs?: Record<string, never>[];
                        requiredFavoriteJsons?: Record<string, never>[];
                        requiredFavoriteNumerics?: number[];
                        requiredFavoriteTexts?: string[];
                        requiredFavoriteUuids?: string[];
                        requiredJsonData?: Record<string, never>;
                        requiredJsonbData?: Record<string, never>;
                        requiredNicknames?: string[];
                        /** @enum {string|null} */
                        species?: "cat" | "noncat" | null;
                        uuid?: string;
                        /** Format: decimal */
                        volume?: number | null;
                        password?: (string | null) | (number | null) | (Record<string, never> | null);
                        openapiVirtualSpecTest?: string | null;
                        openapiVirtualSpecTest2?: string[];
                    };
                };
            };
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        trace?: never;
    };
    "/balloons": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": (components["schemas"]["BalloonLatex"] | components["schemas"]["BalloonMylar"])[];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/balloons/{id}": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BalloonLatex"] | components["schemas"]["BalloonMylar"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/balloons/index-different-dreams": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": (components["schemas"]["BalloonLatex"] | components["schemas"]["BalloonMylar"] | components["schemas"]["Pet"])[];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/balloons/index-dreams-and-view-model": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": (components["schemas"]["BalloonLatex"] | components["schemas"]["BalloonMylar"] | components["schemas"]["Pet"] | components["schemas"]["ViewModelsMyViewModel"])[];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/circular": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CircularHello"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/greeter/justforspecs": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CommentTestingBasicSerializerRef"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/headersOpenapiTest": {
        parameters: {
            query?: never;
            header: {
                /** @description custom header */
                "custom-header"?: string;
                /** @description myDate */
                myDate: string;
                /** @description myOptionalDate */
                myOptionalDate?: string;
                /** @description myOptionalInt */
                myOptionalInt?: number;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header: {
                    /** @description custom header */
                    "custom-header"?: string;
                    /** @description myDate */
                    myDate: string;
                    /** @description myOptionalDate */
                    myOptionalDate?: string;
                    /** @description myOptionalInt */
                    myOptionalInt?: number;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/invalidRequestBody": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        numericParam?: number;
                    };
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/openapi-validation-on-explicit-query-arrays": {
        parameters: {
            query?: {
                /** @description myArray[] */
                "myArray[]"?: string[];
            };
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    /** @description myArray[] */
                    "myArray[]"?: string[];
                };
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success, no content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/openapi-validation-on-explicit-query-arrays-without-brackets": {
        parameters: {
            query?: {
                /** @description myArray */
                myArray?: string[];
            };
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    /** @description myArray */
                    myArray?: string[];
                };
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success, no content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/openapi-validation-test": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        howyadoin?: string | null;
                    };
                };
            };
            responses: {
                /** @description Success, no content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/openapi/openapi-overrides": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/pets": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        /** Format: bigint */
                        collarCount?: string | number | bigint | null;
                        collarCountInt?: number | null;
                        /** Format: decimal */
                        collarCountNumeric?: number | null;
                        favoriteTreats?: ("efishy feesh" | "snick snowcks")[] | null;
                        /** Format: date-time */
                        lastHeardAt?: string;
                        /** Format: date-time */
                        lastSeenAt?: string | null;
                        likesTreats?: boolean;
                        likesWalks?: boolean | null;
                        name?: string | null;
                        nonNullFavoriteTreats?: ("efishy feesh" | "snick snowcks")[];
                        /** @enum {string} */
                        nonNullSpecies?: "cat" | "noncat";
                        /** Format: bigint */
                        requiredCollarCount?: string | number | bigint;
                        requiredCollarCountInt?: number;
                        /** Format: decimal */
                        requiredCollarCountNumeric?: number;
                        /** @enum {string|null} */
                        species?: "cat" | "noncat" | null;
                    };
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Pet"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/pets/{id}": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        /** Format: bigint */
                        collarCount?: string | number | bigint | null;
                        collarCountInt?: number | null;
                        /** Format: decimal */
                        collarCountNumeric?: number | null;
                        favoriteTreats?: ("efishy feesh" | "snick snowcks")[] | null;
                        /** Format: date-time */
                        lastHeardAt?: string;
                        /** Format: date-time */
                        lastSeenAt?: string | null;
                        likesTreats?: boolean;
                        likesWalks?: boolean | null;
                        name?: string | null;
                        nonNullFavoriteTreats?: ("efishy feesh" | "snick snowcks")[];
                        /** @enum {string} */
                        nonNullSpecies?: "cat" | "noncat";
                        /** Format: bigint */
                        requiredCollarCount?: string | number | bigint;
                        requiredCollarCountInt?: number;
                        /** Format: decimal */
                        requiredCollarCountNumeric?: number;
                        /** @enum {string|null} */
                        species?: "cat" | "noncat" | null;
                    };
                };
            };
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        trace?: never;
    };
    "/pets/{id}/my-posts": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        body?: string | null;
                    };
                };
            };
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/queryOpenapiTest": {
        parameters: {
            query?: {
                /** @description stringParam */
                stringParam?: string;
                /** @description numericParam */
                numericParam?: number;
                /** @description stringArray */
                stringArray?: string[];
            };
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    /** @description stringParam */
                    stringParam?: string;
                    /** @description numericParam */
                    numericParam?: number;
                    /** @description stringArray */
                    stringArray?: string[];
                };
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/queryRequiredOpenapiTest": {
        parameters: {
            query: {
                /** @description requiredStringParam */
                requiredStringParam: string;
                /** @description nonRequiredStringParam */
                nonRequiredStringParam?: string;
            };
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query: {
                    /** @description requiredStringParam */
                    requiredStringParam: string;
                    /** @description nonRequiredStringParam */
                    nonRequiredStringParam?: string;
                };
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/requestBodyboilerplateSchemaTest": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["CustomSchemaObject"];
                };
            };
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/requestBodyNestedObjectOpenapiTest": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        nested: {
                            object: {
                                requiredInt: number;
                                optionalInt?: number;
                            };
                        };
                    };
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/requestBodyOpenapiTest": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        requiredInt: number;
                        optionalInt?: number;
                    };
                };
            };
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/responseAlternateStatusTest": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": number;
                    };
                };
                400: components["responses"]["BadRequest"];
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": number;
                    };
                };
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/responseBodyboilerplateSchemaTest": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CustomSchemaObject"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/responseBodyNestedObjectOpenapiTest": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            nested: {
                                object: {
                                    requiredInt: number;
                                    optionalInt?: number;
                                };
                            };
                        };
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/responseBodyObjectOpenapiTest": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            requiredInt: number;
                            optionalInt?: number;
                        };
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/responseBodyOpenapiTest": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": number;
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/serializer-fallbacks/doesnt-use-openapi-serializer": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Pet"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/serializer-fallbacks/overrides-openapi-serializer": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Pet"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/serializer-fallbacks/uses-openapi-serializer": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Pet"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/serializer-fallbacks/uses-openapi-serializer-with-serializer-key": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PetAdditional"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UserExtra"][];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        /** Format: date-time */
                        aDatetime?: string | null;
                        bio?: string;
                        /** Format: date */
                        birthdate?: string | null;
                        /** Format: bigint */
                        collarCount?: string | number | bigint | null;
                        collarCountInt?: number | null;
                        /** Format: decimal */
                        collarCountNumeric?: number | null;
                        /** Format: date */
                        createdOn?: string;
                        email?: string;
                        /** Format: bigint */
                        favoriteBigint?: string | number | bigint | null;
                        favoriteBigints?: (string | number | bigint)[] | null;
                        favoriteBooleans?: boolean[] | null;
                        favoriteCitext?: string | null;
                        favoriteCitexts?: string[] | null;
                        favoriteDates?: string[] | null;
                        favoriteDatetimes?: string[] | null;
                        favoriteIntegers?: number[] | null;
                        favoriteJsonbs?: Record<string, never>[] | null;
                        favoriteJsons?: Record<string, never>[] | null;
                        favoriteNumerics?: number[] | null;
                        favoriteTexts?: string[] | null;
                        favoriteTreats?: ("efishy feesh" | "snick snowcks")[] | null;
                        favoriteUuids?: string[] | null;
                        jsonData?: Record<string, never> | null;
                        jsonbData?: Record<string, never> | null;
                        likesTreats?: boolean;
                        likesWalks?: boolean | null;
                        name?: string | null;
                        nicknames?: string[] | null;
                        notes?: string | null;
                        optionalUuid?: string | null;
                        passwordDigest?: string;
                        /** Format: bigint */
                        requiredCollarCount?: string | number | bigint;
                        requiredCollarCountInt?: number;
                        /** Format: bigint */
                        requiredFavoriteBigint?: string | number | bigint;
                        requiredFavoriteBigints?: (string | number | bigint)[];
                        requiredFavoriteBooleans?: boolean[];
                        requiredFavoriteCitext?: string;
                        requiredFavoriteCitexts?: string[];
                        requiredFavoriteDates?: string[];
                        requiredFavoriteDatetimes?: string[];
                        requiredFavoriteIntegers?: number[];
                        requiredFavoriteJsonbs?: Record<string, never>[];
                        requiredFavoriteJsons?: Record<string, never>[];
                        requiredFavoriteNumerics?: number[];
                        requiredFavoriteTexts?: string[];
                        requiredFavoriteUuids?: string[];
                        requiredJsonData?: Record<string, never>;
                        requiredJsonbData?: Record<string, never>;
                        requiredNicknames?: string[];
                        /** @enum {string|null} */
                        species?: "cat" | "noncat" | null;
                        uuid?: string;
                        /** Format: decimal */
                        volume?: number | null;
                        password?: (string | null) | (number | null) | (Record<string, never> | null);
                        openapiVirtualSpecTest?: string | null;
                        openapiVirtualSpecTest2?: string[];
                    };
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UserExtra"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path: {
                /** @description The ID of the User */
                id: string;
            };
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path: {
                    /** @description The ID of the User */
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UserWithPosts"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path: {
                    /** @description The ID of the User */
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success, no content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path: {
                    /** @description The ID of the User */
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        /** Format: date-time */
                        aDatetime?: string | null;
                        bio?: string;
                        /** Format: date */
                        birthdate?: string | null;
                        /** Format: bigint */
                        collarCount?: string | number | bigint | null;
                        collarCountInt?: number | null;
                        /** Format: decimal */
                        collarCountNumeric?: number | null;
                        /** Format: date */
                        createdOn?: string;
                        email?: string;
                        /** Format: bigint */
                        favoriteBigint?: string | number | bigint | null;
                        favoriteBigints?: (string | number | bigint)[] | null;
                        favoriteBooleans?: boolean[] | null;
                        favoriteCitext?: string | null;
                        favoriteCitexts?: string[] | null;
                        favoriteDates?: string[] | null;
                        favoriteDatetimes?: string[] | null;
                        favoriteIntegers?: number[] | null;
                        favoriteJsonbs?: Record<string, never>[] | null;
                        favoriteJsons?: Record<string, never>[] | null;
                        favoriteNumerics?: number[] | null;
                        favoriteTexts?: string[] | null;
                        favoriteTreats?: ("efishy feesh" | "snick snowcks")[] | null;
                        favoriteUuids?: string[] | null;
                        jsonData?: Record<string, never> | null;
                        jsonbData?: Record<string, never> | null;
                        likesTreats?: boolean;
                        likesWalks?: boolean | null;
                        name?: string | null;
                        nicknames?: string[] | null;
                        notes?: string | null;
                        optionalUuid?: string | null;
                        passwordDigest?: string;
                        /** Format: bigint */
                        requiredCollarCount?: string | number | bigint;
                        requiredCollarCountInt?: number;
                        /** Format: bigint */
                        requiredFavoriteBigint?: string | number | bigint;
                        requiredFavoriteBigints?: (string | number | bigint)[];
                        requiredFavoriteBooleans?: boolean[];
                        requiredFavoriteCitext?: string;
                        requiredFavoriteCitexts?: string[];
                        requiredFavoriteDates?: string[];
                        requiredFavoriteDatetimes?: string[];
                        requiredFavoriteIntegers?: number[];
                        requiredFavoriteJsonbs?: Record<string, never>[];
                        requiredFavoriteJsons?: Record<string, never>[];
                        requiredFavoriteNumerics?: number[];
                        requiredFavoriteTexts?: string[];
                        requiredFavoriteUuids?: string[];
                        requiredJsonData?: Record<string, never>;
                        requiredJsonbData?: Record<string, never>;
                        requiredNicknames?: string[];
                        /** @enum {string|null} */
                        species?: "cat" | "noncat" | null;
                        uuid?: string;
                        /** Format: decimal */
                        volume?: number | null;
                        password?: (string | null) | (number | null) | (Record<string, never> | null);
                        openapiVirtualSpecTest?: string | null;
                        openapiVirtualSpecTest2?: string[];
                    };
                };
            };
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        trace?: never;
    };
    "/users/{id}/justforspecs": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CommentTestingBasicSerializerRef"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}/with-posts": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UserWithPosts"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/paginated": {
        parameters: {
            query?: {
                /** @description Page number */
                page?: string;
            };
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    /** @description Page number */
                    page?: string;
                };
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            recordCount: number;
                            pageCount: number;
                            currentPage: number;
                            results: components["schemas"]["UserSummary"][];
                        };
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/paginated-post": {
        parameters: {
            query?: never;
            header?: {
                /** @description custom header */
                "custom-header"?: string;
            };
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: {
                    /** @description custom header */
                    "custom-header"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        /** Format: date-time */
                        aDatetime?: string | null;
                        bio?: string;
                        /** Format: date */
                        birthdate?: string | null;
                        /** Format: bigint */
                        collarCount?: string | number | bigint | null;
                        collarCountInt?: number | null;
                        /** Format: decimal */
                        collarCountNumeric?: number | null;
                        /** Format: date */
                        createdOn?: string;
                        email?: string;
                        /** Format: bigint */
                        favoriteBigint?: string | number | bigint | null;
                        favoriteBigints?: (string | number | bigint)[] | null;
                        favoriteBooleans?: boolean[] | null;
                        favoriteCitext?: string | null;
                        favoriteCitexts?: string[] | null;
                        favoriteDates?: string[] | null;
                        favoriteDatetimes?: string[] | null;
                        favoriteIntegers?: number[] | null;
                        favoriteJsonbs?: Record<string, never>[] | null;
                        favoriteJsons?: Record<string, never>[] | null;
                        favoriteNumerics?: number[] | null;
                        favoriteTexts?: string[] | null;
                        favoriteTreats?: ("efishy feesh" | "snick snowcks")[] | null;
                        favoriteUuids?: string[] | null;
                        jsonData?: Record<string, never> | null;
                        jsonbData?: Record<string, never> | null;
                        likesTreats?: boolean;
                        likesWalks?: boolean | null;
                        name?: string | null;
                        nicknames?: string[] | null;
                        notes?: string | null;
                        optionalUuid?: string | null;
                        passwordDigest?: string;
                        /** Format: bigint */
                        requiredCollarCount?: string | number | bigint;
                        requiredCollarCountInt?: number;
                        /** Format: bigint */
                        requiredFavoriteBigint?: string | number | bigint;
                        requiredFavoriteBigints?: (string | number | bigint)[];
                        requiredFavoriteBooleans?: boolean[];
                        requiredFavoriteCitext?: string;
                        requiredFavoriteCitexts?: string[];
                        requiredFavoriteDates?: string[];
                        requiredFavoriteDatetimes?: string[];
                        requiredFavoriteIntegers?: number[];
                        requiredFavoriteJsonbs?: Record<string, never>[];
                        requiredFavoriteJsons?: Record<string, never>[];
                        requiredFavoriteNumerics?: number[];
                        requiredFavoriteTexts?: string[];
                        requiredFavoriteUuids?: string[];
                        requiredJsonData?: Record<string, never>;
                        requiredJsonbData?: Record<string, never>;
                        requiredNicknames?: string[];
                        /** @enum {string|null} */
                        species?: "cat" | "noncat" | null;
                        uuid?: string;
                        /** Format: decimal */
                        volume?: number | null;
                        password?: (string | null) | (number | null) | (Record<string, never> | null);
                        openapiVirtualSpecTest?: string | null;
                        openapiVirtualSpecTest2?: string[];
                        /** @description Page number */
                        page?: number;
                    };
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            recordCount: number;
                            pageCount: number;
                            currentPage: number;
                            results: components["schemas"]["UserSummary"][];
                        };
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                418: components["responses"]["CustomResponse"];
                422: components["responses"]["ValidationErrors"];
                490: components["responses"]["CustomResponse"];
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        BalloonLatex: {
            /** @enum {string|null} */
            color: "blue" | "green" | "red" | null;
            /** Format: bigint */
            id: string | number | bigint;
            latexOnlyAttr: string;
        };
        BalloonMylar: {
            /** @enum {string|null} */
            color: "blue" | "green" | "red" | null;
            /** Format: bigint */
            id: string | number | bigint;
            mylarOnlyAttr: string;
        };
        CircularHello: {
            user: components["schemas"]["User"];
            world: components["schemas"]["CircularWorld"];
        };
        CircularWorld: {
            hello: components["schemas"]["CircularHello"];
        };
        Comment: {
            body: string | null;
            /** Format: bigint */
            id: string | number | bigint;
        };
        CommentTestingBasicSerializerRef: {
            howyadoin: components["schemas"]["LatexSummary"];
        };
        CustomSchema: string;
        CustomSchemaObject: {
            myField?: string;
        };
        LatexSummary: {
            /** Format: bigint */
            id: string | number | bigint;
            latexOnlySummaryAttr: string;
        };
        OpenapiValidationErrors: {
            /** @enum {string} */
            type: "openapi";
            /** @enum {string} */
            target: "requestBody" | "query" | "headers" | "responseBody";
            errors: {
                instancePath: string;
                schemaPath: string;
                keyword: string;
                message: string;
                params: Record<string, never>;
            }[];
        };
        Pet: {
            customAttributeTest: string;
            /** Format: bigint */
            id: string | number | bigint;
            name: string | null;
        };
        PetAdditional: {
            customAttributeTest: string;
            /** Format: bigint */
            id: string | number | bigint;
            nickname: string;
        };
        Post: {
            body: string | null;
            comments: components["schemas"]["Comment"][];
            explicitlyOmittedFromParamSafeColumns: string | null;
            /** Format: bigint */
            id: string | number | bigint;
        };
        PostWithComments: {
            body: string | null;
            comments: components["schemas"]["Comment"][];
            /** Format: bigint */
            id: string | number | bigint;
        };
        User: {
            email: string;
            id: number;
            name: string | null;
        };
        UserExtra: {
            howyadoin: {
                name?: string;
                stuff?: string[];
                nestedStuff?: {
                    nested1?: boolean;
                    nested2?: number[];
                };
            };
            id: number;
            nicknames: string[] | null;
        };
        UserSummary: {
            id: number;
        };
        UserWithPosts: {
            id: number;
            posts: components["schemas"]["PostWithComments"][];
        };
        ValidationErrors: {
            /** @enum {string} */
            type: "validation";
            errors: {
                [key: string]: string[];
            };
        };
        ViewModelsMyViewModel: {
            favoriteNumber: number | null;
            name: string | null;
        };
    };
    responses: {
        /** @description The request has succeeded, but there is no content to render */
        NoContent: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
        /** @description The server would not process the request due to something the server considered to be a client error, such as a model validation failure or an openapi validation failure */
        BadRequest: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ValidationErrors"] | components["schemas"]["OpenapiValidationErrors"];
            };
        };
        /** @description The request was not successful because it lacks valid authentication credentials for the requested resource */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
        /** @description Understood the request, but refused to process it */
        Forbidden: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
        /** @description The specified resource was not found */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
        /** @description The request failed because a conflict was detected with the given request params */
        Conflict: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
        /** @description The request failed to process due to validation errors with the provided values */
        ValidationErrors: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ValidationErrors"];
            };
        };
        /** @description the server encountered an unexpected condition that prevented it from fulfilling the request */
        InternalServerError: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
        /** @description my custom response */
        CustomResponse: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": string;
            };
        };
    };
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
