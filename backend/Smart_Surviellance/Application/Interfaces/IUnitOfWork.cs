using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {

        ICameraRepository CameraRepository { get; }
        IAlertRepository AlertRepository { get; }

        Task<int> SaveChangesAsync();



    }
}
