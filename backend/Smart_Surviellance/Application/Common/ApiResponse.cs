using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Common
{
    public class ApiResponse<T>
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }


        public static ApiResponse<T> Success(T data, string message = null)
            => new ApiResponse<T> { IsSuccess = true, Data = data, Message = message };

        public static ApiResponse<T> SuccessNoData( string message = null)
            => new ApiResponse<T> { IsSuccess = true,  Message = message };

        public static ApiResponse<T> Fail(string message)
            => new ApiResponse<T> { IsSuccess = false, Message = message };
    }
}
