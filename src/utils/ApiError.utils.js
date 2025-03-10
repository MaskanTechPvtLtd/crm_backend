class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = [], data = null, code = null, correlationId = null, innerError = null, stackOverride = "") {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.data = data;
    this.success = false;
    this.code = code;
    this.correlationId = correlationId;
    this.timestamp = new Date().toISOString();
    this.innerError = innerError ? innerError.toString() : null;
    if (stackOverride) {
      this.stack = stackOverride;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      code: this.code,
      message: this.message,
      errors: this.errors,
      data: this.data,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      innerError: this.innerError,
    };
  }
}

export { ApiError };
















// class ApiError extends Error {
//   constructor(
//     statusCode,
//     message = "Something went wrong",
//     errors = [],
//     stack = ""
//   ) {
//     // Call the parent Error class constructor with the message
//     super(message);

//     // Setting properties specific to ApiError
//     this.statusCode = statusCode;
//     this.success = false;
//     this.errors = errors;
//     this.data = null;

//     // Assign the stack trace only if it's provided, otherwise use the default stack trace
//     if (stack) {
//       this.stack = stack;
//     } else {
//       Error.captureStackTrace(this, this.constructor);
//     }
//   }
// }

// export { ApiError };

// class ApiError extends Error {
//   constructor(
//     StatusCode,
//     message = "something went wrong",
//     errors = [],
//     Stack = ""
//   ) {
//     super(message);
//     this.StatusCode = StatusCode;
//     this.data = null;
//     this.message = message;
//     (this.success = false), (this.error = errors);
//     if(Stack){
//         this.stack = Stack
//     }else{
//         Error.captureStackTrace(this,this.constructor)
//     }
//   }
// }

// export { ApiError };
