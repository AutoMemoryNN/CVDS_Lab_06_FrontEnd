import type { Todo } from '@components';
import type React from 'react';
import type { RouteObject } from 'react-router-dom';

import {
	Button,
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
	Select,
	SelectItem,
	TextArea,
	TextInput,
	TodoItem,
	toast,
} from '@components';
import { ModalProvider, useModal } from '@components/modal/providers';
import { loader } from '@routes/home/loader';
import {
	TodoFilterProvider,
	TodoListProvider,
	useTodoFilter,
	useTodoList,
} from '@routes/home/providers';
import { useMemo, useState } from 'react';

import cookies from 'js-cookie';

import styles from './styles.module.css';

function Title() {
	return <h1 className={styles.pageTitle}>Todo App</h1>;
}

function TodoList() {
	const { filter } = useTodoFilter();
	const { todos, areTodosLoading } = useTodoList();

	const filteredTodoList = useMemo(() => {
		return todos.filter((todo) => {
			const matchName = todo.name
				.toLowerCase()
				.includes(filter.toLowerCase());
			const matchDescription = todo.description
				.toLowerCase()
				.includes(filter.toLowerCase());
			const matchDifficulty = todo.difficulty
				?.toLowerCase()
				.includes(filter.toLowerCase());
			const matchPriority = todo.priority?.toString().includes(filter);

			return (
				matchName ||
				matchDescription ||
				matchDifficulty ||
				matchPriority
			);
		});
	}, [filter, todos]);

	if (areTodosLoading) {
		return <p className='text-center self-center'>Loading...</p>;
	}

	if (filteredTodoList.length === 0) {
		return <p className='text-center self-center'>No tasks found.</p>;
	}

	return (
		<ul className={styles.todoList}>
			{filteredTodoList.map((todo, index) => (
				<TodoItem key={todo.id} index={index} {...todo} />
			))}
		</ul>
	);
}

function Filter() {
	const { filter, setFilter } = useTodoFilter();

	return (
		<TextInput
			placeholder='Search for...'
			value={filter}
			onValueChange={setFilter}
		/>
	);
}

function CreateTodoModal() {
	const { closeModal } = useModal();
	const [isLoading, setLoading] = useState(false);
	const { addTodo, updateTodo, usingOptimistic } = useTodoList();

	const onFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		setLoading(true);

		await usingOptimistic(async () => {
			const form = event.currentTarget;
			const formData = new FormData(form);

			const data = Object.fromEntries(formData.entries());
			const endpoint = `${import.meta.env.VITE_API_URL}/tasks`;
			const optimisticTodo = {
				id: `optimistic-${Date.now()}`,
				...data,
			} as Todo;

			addTodo(optimisticTodo);
			closeModal();

			const sessionCookie = cookies.get('__scss') ?? '';

			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					authorization: sessionCookie,
				},
				body: JSON.stringify(data),
			});

			if (response.ok) {
				form.reset();
				const createdTodo = await response.json();
				updateTodo(optimisticTodo.id, createdTodo);
			} else {
				toast.error('Failed to create todo');
				throw new Error('Failed to create todo');
			}
		});

		setLoading(false);
	};

	return (
		<>
			<form onSubmit={onFormSubmit} data-loading={isLoading}>
				<Modal>
					<ModalHeader>
						<h2 className='text-2xl font-semibold text-blue-500'>
							Create a new todo
						</h2>
					</ModalHeader>

					<ModalBody>
						<TextInput
							placeholder='Name'
							className='col-span-12'
							name='name'
							autoFocus={true}
							required={true}
						/>
						<Select
							className='col-span-6'
							name='difficulty'
							required={true}
						>
							<SelectItem key='high' value='high'>
								High
							</SelectItem>
							<SelectItem key='medium' value='medium'>
								Medium
							</SelectItem>
							<SelectItem key='low' value='low'>
								Low
							</SelectItem>
						</Select>
						<TextInput
							placeholder='Priority'
							className='col-span-6'
							type='number'
							name='priority'
							min={1}
							max={5}
							required={true}
						/>
						<TextArea
							placeholder='Description'
							name='description'
							className='col-span-12'
						/>
					</ModalBody>

					<ModalFooter>
						<Button onClick={closeModal} type='button'>
							Cancel
						</Button>
						<Button isPrimary={true} type='submit'>
							Create
						</Button>
					</ModalFooter>
				</Modal>
			</form>
		</>
	);
}

function CreateTodoButton() {
	const { openModal } = useModal();

	return (
		<Button
			onClick={openModal}
			isPrimary={true}
			className={styles.createTodoButton}
		>
			Create Task
		</Button>
	);
}

function AnalyticsButton() {
	return (
		<Button
			isPrimary={true}
			className={styles.analyticsButton}
			to='/analytics'
		>
			Analytics
		</Button>
	);
}

function PageContent() {
	return (
		<>
			<main className={styles.mainContent}>
				<Filter />
				<TodoList />
				<CreateTodoModal />
			</main>
		</>
	);
}

function FooterContent() {
	return (
		<footer className={styles.footer}>
			<div />
			<AnalyticsButton />
			<CreateTodoButton />
		</footer>
	);
}

function HomePage() {
	return (
		<>
			<div className={styles.homeContainer}>
				<TodoListProvider>
					<TodoFilterProvider>
						<ModalProvider>
							<Title />
							<PageContent />
							<FooterContent />
						</ModalProvider>
					</TodoFilterProvider>
				</TodoListProvider>
			</div>
		</>
	);
}

export const HomeRoute: RouteObject = {
	path: '/',
	element: <HomePage />,
	loader: loader,
};
