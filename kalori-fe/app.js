$(document).ready(function () {
    const caloriesBurnedPerMinute = {
        running: 10,
        cycling: 8,
        swimming: 12,
        walking: 4,
    };

    const exerciseTypeMapping = {
        running: "Lari",
        cycling: "Bersepeda",
        swimming: "Berenang",
        walking: "Berjalan",
    };

    let exerciseHistory = []; // Data riwayat latihan
    let editIndex = null; // Menyimpan indeks untuk item yang sedang diedit

    // Fungsi untuk menampilkan pesan
    function showMessage(type, message) {
        const alertBox = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $("#messages").html(alertBox);
    }

    // Fungsi untuk sinkronisasi data dari server ke localStorage
    function syncWithServer() {
        if (navigator.onLine) {
            $.get("http://127.0.0.1:8000/allexercises")
                .done(function (data) {
                    exerciseHistory = data.data.map((entry) => ({
                        id: entry.id,
                        exercise: entry.exercise.toLowerCase(),
                        duration: entry.duration,
                        calories: entry.calories,
                    }));
                    localStorage.setItem("exerciseHistory", JSON.stringify(exerciseHistory));
                    updateExerciseHistory();
                    showMessage("success", "Data berhasil disinkronisasi dengan server!");
                })
                .fail(function (xhr) {
                    showMessage("danger", `Gagal memuat data dari server: ${xhr.responseText || "Unknown error"}`);
                });
        } else {
            exerciseHistory = JSON.parse(localStorage.getItem("exerciseHistory") || "[]");
            updateExerciseHistory();
            showMessage("warning", "Anda sedang offline. Data ditampilkan dari local storage.");
        }
    }

    // Fungsi untuk memperbarui daftar riwayat latihan
    function updateExerciseHistory() {
        $("#history-list").empty();
        if (exerciseHistory.length === 0) {
            $("#history-list").append(`<li class="list-group-item text-center">Tidak ada data latihan.</li>`);
            return;
        }

        exerciseHistory.forEach((entry, index) => {
            const displayType = exerciseTypeMapping[entry.exercise] || entry.exercise;
            const listItem = `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${displayType}</strong> - ${entry.duration} menit - ${entry.calories} kalori
                    </div>
                    <div>
                        <button class="btn btn-sm btn-warning edit-btn me-2" data-index="${index}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-index="${index}">Delete</button>
                    </div>
                </li>
            `;
            $("#history-list").append(listItem);
        });
    }

    // Fungsi untuk menambah data ke server
    function addExercise(exerciseData) {
        if (navigator.onLine) {
            $.post("http://127.0.0.1:8000/exercises", exerciseData)
                .done(function () {
                    syncWithServer();
                    showMessage("success", "Latihan baru berhasil ditambahkan ke server!");
                })
                .fail(function (xhr) {
                    showMessage("danger", `Gagal menambahkan data ke server: ${xhr.responseText || "Unknown error"}`);
                });
        } else {
            exerciseHistory.push({
                id: Date.now(),
                ...exerciseData,
            });
            localStorage.setItem("exerciseHistory", JSON.stringify(exerciseHistory));
            updateExerciseHistory();
            showMessage("warning", "Anda sedang offline. Data disimpan secara lokal.");
        }
    }

    // Fungsi untuk mengedit data
    function updateExercise(id, updatedData) {
        if (navigator.onLine) {
            $.post(`http://127.0.0.1:8000/exercises/update/${id}`, updatedData)
                .done(function () {
                    syncWithServer();
                    showMessage("success", "Data berhasil diperbarui di server!");
                })
                .fail(function (xhr) {
                    showMessage("danger", `Gagal memperbarui data di server: ${xhr.responseText || "Unknown error"}`);
                });
        } else {
            const index = exerciseHistory.findIndex((entry) => entry.id === id);
            if (index > -1) {
                exerciseHistory[index] = { id, ...updatedData };
                localStorage.setItem("exerciseHistory", JSON.stringify(exerciseHistory));
                updateExerciseHistory();
                showMessage("warning", "Anda sedang offline. Perubahan disimpan secara lokal.");
            }
        }
    }

    // Fungsi untuk menghapus data
    function deleteExercise(id) {
        if (navigator.onLine) {
            $.ajax({
                url: `http://127.0.0.1:8000/exercises/${id}`,
                type: "DELETE",
            })
                .done(function () {
                    syncWithServer();
                    showMessage("success", "Data berhasil dihapus dari server!");
                })
                .fail(function (xhr) {
                    showMessage("danger", `Gagal menghapus data di server: ${xhr.responseText || "Unknown error"}`);
                });
        } else {
            exerciseHistory = exerciseHistory.filter((entry) => entry.id !== id);
            localStorage.setItem("exerciseHistory", JSON.stringify(exerciseHistory));
            updateExerciseHistory();
            showMessage("warning", "Anda sedang offline. Data dihapus secara lokal.");
        }
    }

    // Event Listener untuk form submit
    $("#exercise-form").on("submit", function (e) {
        e.preventDefault();

        const exerciseType = $("#exercise-type").val();
        const duration = parseInt($("#duration").val());

        if (!duration || duration <= 0) {
            showMessage("warning", "Durasi harus lebih dari 0 menit");
            return;
        }

        const caloriesBurned = caloriesBurnedPerMinute[exerciseType] * duration;
        const exerciseData = {
            exercise: exerciseType,
            duration: duration,
            calories: caloriesBurned,
        };

        if (editIndex === null) {
            addExercise(exerciseData);
        } else {
            const id = exerciseHistory[editIndex].id;
            updateExercise(id, exerciseData);
            editIndex = null;
            resetFormState();
        }
    });

    // Event Listener untuk tombol Edit
    $("#history-list").on("click", ".edit-btn", function () {
        const index = $(this).data("index");
        const entry = exerciseHistory[index];

        $("#exercise-type").val(entry.exercise);
        $("#duration").val(entry.duration);
        editIndex = index;

        $("#submit-btn").text("Update");
        $("#cancel-btn").removeClass("d-none");
    });

    // Event Listener untuk tombol Delete
    $("#history-list").on("click", ".delete-btn", function () {
        const index = $(this).data("index");
        const id = exerciseHistory[index].id;
        deleteExercise(id);
    });

    // Event Listener untuk tombol Batal
    $("#cancel-btn").on("click", function () {
        editIndex = null;
        resetFormState();
    });

    // Sinkronisasi data saat halaman dimuat
    syncWithServer();
});
